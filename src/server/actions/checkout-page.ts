"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import {
  buildTicketQrToken,
  generateTicketSerialNumber,
  hashTicketQrToken,
} from "@/lib/ticketing";

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export async function completeCheckoutAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const ticketTypeId = String(formData.get("ticketTypeId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const paymentMethod = String(formData.get("paymentMethod") ?? "OTHER");
  const paymentLabel = String(formData.get("paymentLabel") ?? "Paiement simulé");

  if (!ticketTypeId || !quantity || quantity < 1) {
    throw new Error("Données de paiement invalides.");
  }

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
        totalAmount: subtotal,
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

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "FAKE_CHECKOUT_PAGE",
        providerReference: `fake_${order.id}`,
        status: "SUCCEEDED",
        method:
          paymentMethod === "CARD"
            ? "CARD"
            : paymentMethod === "CASH"
              ? "CASH"
              : "MOBILE_MONEY",
        amount: subtotal,
        currency: "XOF",
        paidAt: new Date(),
        rawPayload: {
          mode: "local-fake-checkout",
          paymentMethod,
          paymentLabel,
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
    }

    return order.id;
  });

  redirect(`/checkout/success?mode=buy`);
}

export async function completeReservationCheckoutAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const ticketTypeId = String(formData.get("ticketTypeId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const paymentMethod = String(formData.get("paymentMethod") ?? "OTHER");
  const paymentLabel = String(formData.get("paymentLabel") ?? "Paiement simulé");

  if (!ticketTypeId || !quantity || quantity < 1) {
    throw new Error("Données de réservation invalides.");
  }

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
        provider: "FAKE_CHECKOUT_PAGE_RESERVATION",
        providerReference: `fake_reservation_${order.id}`,
        status: "SUCCEEDED",
        method:
          paymentMethod === "CARD"
            ? "CARD"
            : paymentMethod === "CASH"
              ? "CASH"
              : "MOBILE_MONEY",
        amount: depositAmount,
        currency: "XOF",
        paidAt: new Date(),
        rawPayload: {
          mode: "local-fake-checkout",
          paymentMethod,
          paymentLabel,
          kind: "deposit",
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

    return order.id;
  });

  redirect(`/checkout/success?mode=reserve`);
}