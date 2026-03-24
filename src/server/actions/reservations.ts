"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import {
  buildTicketQrToken,
  generateTicketSerialNumber,
  hashTicketQrToken,
} from "@/lib/ticketing";
import {
  createReservationSchema,
  payReservationBalanceSchema,
} from "@/validators/reservation";

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export async function createReservationAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const parsed = createReservationSchema.safeParse({
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
    });

    if (!user) {
      throw new Error("Utilisateur introuvable.");
    }

    const ticketType = await tx.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: {
        reservationPolicy: true,
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

    if (!ticketType.isReservable || !ticketType.reservationPolicy?.isEnabled) {
      throw new Error("Ce billet n'est pas réservable.");
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
    const depositPercent = Number(ticketType.reservationPolicy.depositPercent ?? 0);
    const depositAmount = Math.max(
      0,
      Math.round((subtotal * depositPercent) / 100),
    );
    const commissionAmount = Math.round(
      (subtotal * agency.commissionRateBps) / 10000,
    );

    const gracePeriodHours = ticketType.reservationPolicy.gracePeriodHours ?? 72;
    const expiresAt = addHours(new Date(), gracePeriodHours);

    const order = await tx.order.create({
      data: {
        userId: user.id,
        agencyId: agency.id,
        customerEmail: user.email,
        customerName: user.fullName,
        customerPhone: user.phone,
        status: "PARTIALLY_PAID",
        subtotalAmount: subtotal,
        feesAmount: 0,
        discountAmount: 0,
        commissionAmount,
        totalAmount: subtotal,
        currency: "XOF",
        source: "web",
        expiresAt,
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

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "LOCAL_DEV_RESERVATION",
        providerReference: `reservation_${order.id}`,
        status: "SUCCEEDED",
        method: "OTHER",
        amount: depositAmount,
        currency: "XOF",
        paidAt: new Date(),
        rawPayload: {
          mode: "local-dev",
          kind: "deposit",
          simulated: true,
          depositPercent,
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
          status: "RESERVED",
        },
      });

      const rawToken = buildTicketQrToken(ticket.id, serialNumber);
      const qrTokenHash = hashTicketQrToken(rawToken);

      await tx.ticket.update({
        where: { id: ticket.id },
        data: { qrTokenHash },
      });
    }

    return { orderId: order.id };
  });

  revalidatePath("/account");
  revalidatePath("/account/reservations");
  revalidatePath("/account/tickets");

  redirect(`/account/reservations?order=${result.orderId}`);
}

export async function payReservationBalanceAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const parsed = payReservationBalanceSchema.safeParse({
    orderId: formData.get("orderId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Commande invalide");
  }

  const { orderId } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: orderId,
        userId: session.userId,
      },
      include: {
        payments: {
          where: {
            status: "SUCCEEDED",
          },
        },
        items: {
          include: {
            tickets: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Commande introuvable.");
    }

    if (order.status !== "PARTIALLY_PAID") {
      throw new Error("Cette réservation n'attend pas de solde.");
    }

    const alreadyPaid = order.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    const totalAmount = Number(order.totalAmount);
    const remainingAmount = totalAmount - alreadyPaid;

    if (remainingAmount <= 0) {
      throw new Error("Aucun solde restant.");
    }

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "LOCAL_DEV_RESERVATION_BALANCE",
        providerReference: `balance_${order.id}_${Date.now()}`,
        status: "SUCCEEDED",
        method: "OTHER",
        amount: remainingAmount,
        currency: "XOF",
        paidAt: new Date(),
        rawPayload: {
          mode: "local-dev",
          kind: "balance",
          simulated: true,
        },
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        expiresAt: null,
      },
    });

    for (const item of order.items) {
      for (const ticket of item.tickets) {
        if (ticket.status === "RESERVED") {
          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              status: "ISSUED",
              issuedAt: new Date(),
            },
          });
        }
      }
    }
  });

  revalidatePath("/account");
  revalidatePath("/account/reservations");
  revalidatePath("/account/tickets");

  redirect("/account/tickets");
}