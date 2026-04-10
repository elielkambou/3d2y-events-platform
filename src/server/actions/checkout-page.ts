"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import {
  buildTicketQrToken,
  generateTicketSerialNumber,
  hashTicketQrToken,
} from "@/lib/ticketing";
import { sendGuestTicketsEmail } from "@/server/services/ticket-delivery";

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export async function completeCheckoutAction(formData: FormData) {
  const session = await getSession();

  const ticketTypeId = String(formData.get("ticketTypeId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const paymentMethod = String(formData.get("paymentMethod") ?? "OTHER");
  const paymentLabel = String(formData.get("paymentLabel") ?? "Paiement simulé");
  const customerName = String(formData.get("customerName") ?? "").trim();

  // Email désormais optionnel pour l'achat direct
  const customerEmail = String(formData.get("customerEmail") ?? "")
    .trim()
    .toLowerCase();

  const customerPhoneRaw = String(formData.get("customerPhone") ?? "").trim();
  const customerPhone = customerPhoneRaw.length > 0 ? customerPhoneRaw : null;

  if (!ticketTypeId || !quantity || quantity < 1) {
    throw new Error("Données de paiement invalides.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = session
      ? await tx.user.findUnique({
          where: { id: session.userId },
        })
      : null;

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

    const effectiveName = user?.fullName?.trim() || customerName;
    const effectiveEmail = user?.email?.trim().toLowerCase() || customerEmail || "";
    const effectivePhone = user?.phone ?? customerPhone;

    if (!effectiveName) {
      throw new Error("Le nom est requis pour finaliser l'achat.");
    }

    const order = await tx.order.create({
      data: {
        userId: user?.id ?? null,
        agencyId: agency.id,
        customerEmail: effectiveEmail,
        customerName: effectiveName,
        customerPhone: effectivePhone,
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
          holderName: effectiveName,
          holderEmail: effectiveEmail,
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

    return {
      orderId: order.id,
      customerEmail: effectiveEmail,
    };
  });

  let emailSent = false;

  try {
    const emailResult = await sendGuestTicketsEmail(
      result.orderId,
      result.customerEmail,
    );
    emailSent = Boolean(emailResult.ok && !emailResult.skipped);
  } catch (error) {
    console.error("Guest ticket email delivery failed:", error);
  }

  redirect(
    `/checkout/success?mode=buy&orderId=${encodeURIComponent(
      result.orderId,
    )}&email=${encodeURIComponent(result.customerEmail)}&emailSent=${
      emailSent ? "1" : "0"
    }`,
  );
}

export async function completeReservationCheckoutAction(formData: FormData) {
  const session = await getSession();

  const ticketTypeId = String(formData.get("ticketTypeId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const paymentMethod = String(formData.get("paymentMethod") ?? "OTHER");
  const paymentLabel = String(formData.get("paymentLabel") ?? "Paiement simulé");
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "")
    .trim()
    .toLowerCase();
  const customerPhoneRaw = String(formData.get("customerPhone") ?? "").trim();
  const customerPhone = customerPhoneRaw.length > 0 ? customerPhoneRaw : null;

  if (!ticketTypeId || !quantity || quantity < 1) {
    throw new Error("Données de réservation invalides.");
  }
  if (!customerName || !customerEmail) {
    throw new Error("Nom et email sont requis pour finaliser la réservation.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = session
      ? await tx.user.findUnique({
          where: { id: session.userId },
        })
      : null;

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
    const depositPercent = Number(
      ticketType.reservationPolicy.depositPercent ?? 0,
    );
    const depositAmount = Math.max(
      0,
      Math.round((subtotal * depositPercent) / 100),
    );
    const commissionAmount = Math.round(
      (subtotal * agency.commissionRateBps) / 10000,
    );
    const gracePeriodHours = ticketType.reservationPolicy.gracePeriodHours ?? 72;
    const expiresAt = addHours(new Date(), gracePeriodHours);

    const effectiveEmail = user?.email ?? customerEmail;
    const effectiveName = user?.fullName ?? customerName;
    const effectivePhone = user?.phone ?? customerPhone;

    const order = await tx.order.create({
      data: {
        userId: user?.id ?? null,
        agencyId: agency.id,
        customerEmail: effectiveEmail,
        customerName: effectiveName,
        customerPhone: effectivePhone,
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
          holderName: effectiveName,
          holderEmail: effectiveEmail,
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

    return {
      orderId: order.id,
      customerEmail: effectiveEmail,
    };
  });

  let emailSent = false;

  try {
    const emailResult = await sendGuestTicketsEmail(
      result.orderId,
      result.customerEmail,
    );
    emailSent = Boolean(emailResult.ok && !emailResult.skipped);
  } catch (error) {
    console.error("Guest ticket email delivery failed:", error);
  }

  redirect(
    `/checkout/success?mode=reserve&orderId=${encodeURIComponent(
      result.orderId,
    )}&email=${encodeURIComponent(result.customerEmail)}&emailSent=${
      emailSent ? "1" : "0"
    }`,
  );
}