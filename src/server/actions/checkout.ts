"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { createCheckoutOrderSchema } from "@/validators/checkout";
import {
  buildTicketQrToken,
  generateTicketSerialNumber,
  hashTicketQrToken,
} from "@/lib/ticketing";

export async function createCheckoutOrderAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const parsed = createCheckoutOrderSchema.safeParse({
    ticketTypeId: formData.get("ticketTypeId"),
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
  }

  const { ticketTypeId, quantity } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: session.userId },
      include: {
        agency: true,
      },
    });

    if (!user) {
      throw new Error("Utilisateur introuvable.");
    }

    const ticketType = await tx.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: {
        occurrence: {
          include: {
            event: {
              include: {
                agency: true,
              },
            },
          },
        },
      },
    });

    if (!ticketType) {
      throw new Error("Type de billet introuvable.");
    }

    if (ticketType.status !== "ACTIVE") {
      throw new Error("Ce billet n'est pas disponible.");
    }

    if (ticketType.maxPerOrder && quantity > ticketType.maxPerOrder) {
      throw new Error("Quantité supérieure au maximum autorisé.");
    }

    const occurrence = ticketType.occurrence;
    const event = occurrence.event;
    const agency = event.agency;

    if (event.status !== "PUBLISHED" || !event.isPublished) {
      throw new Error("Événement non publié.");
    }

    if (occurrence.status !== "PUBLISHED") {
      throw new Error("Cette date n'est pas disponible.");
    }

    const soldCount = await tx.ticket.count({
      where: {
        ticketTypeId: ticketType.id,
        status: {
          in: ["ISSUED", "CHECKED_IN", "TRANSFERRED", "RESERVED"],
        },
      },
    });

    if (soldCount + quantity > ticketType.totalStock) {
      throw new Error("Stock insuffisant.");
    }

    const unitPrice = Number(ticketType.priceAmount);
    const subtotal = unitPrice * quantity;
    const commissionAmount = Math.round(
      (subtotal * agency.commissionRateBps) / 10000,
    );
    const totalAmount = subtotal;

    const order = await tx.order.create({
      data: {
        userId: user.id,
        agencyId: agency.id,
        customerEmail: user.email,
        customerName: user.fullName,
        customerPhone: user.phone,
        status: "PAID",
        subtotalAmount: subtotal,
        feesAmount: 0,
        discountAmount: 0,
        commissionAmount,
        totalAmount,
        currency: "XOF",
        source: "web",
        paidAt: new Date(),
      },
    });

    const orderItem = await tx.orderItem.create({
      data: {
        orderId: order.id,
        ticketTypeId: ticketType.id,
        occurrenceId: occurrence.id,
        quantity,
        unitPrice,
        lineTotal: subtotal,
      },
    });

    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "LOCAL_DEV",
        providerReference: `local_${order.id}`,
        status: "SUCCEEDED",
        method: "OTHER",
        amount: totalAmount,
        currency: "XOF",
        paidAt: new Date(),
        rawPayload: {
          mode: "local-dev",
          simulated: true,
        },
      },
    });

    await tx.commissionLedger.create({
      data: {
        agencyId: agency.id,
        orderId: order.id,
        grossAmount: subtotal,
        commissionAmount,
        netAmount: subtotal - commissionAmount,
      },
    });

    const createdTickets: string[] = [];

    for (let i = 0; i < quantity; i += 1) {
      const serialNumber = generateTicketSerialNumber();

      const ticket = await tx.ticket.create({
        data: {
          orderItemId: orderItem.id,
          ticketTypeId: ticketType.id,
          occurrenceId: occurrence.id,
          holderName: user.fullName,
          holderEmail: user.email,
          serialNumber,
          qrTokenHash: "temp",
          status: "ISSUED",
          issuedAt: new Date(),
        },
      });

      const rawToken = buildTicketQrToken(ticket.id, serialNumber);
      const qrTokenHash = hashTicketQrToken(rawToken);

      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          qrTokenHash,
        },
      });

      createdTickets.push(ticket.id);
    }

    return {
      orderId: order.id,
      paymentId: payment.id,
      ticketIds: createdTickets,
    };
  });

  redirect(`/account/tickets?order=${result.orderId}`);
}