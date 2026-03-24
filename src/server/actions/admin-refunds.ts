"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { getAdminContext } from "@/server/queries/admin";

async function ensureAdmin() {
  const context = await getAdminContext();

  if (!context) {
    throw new Error("Accès admin invalide.");
  }

  return context;
}

export async function refundOrderAction(formData: FormData) {
  const context = await ensureAdmin();

  const orderId = String(formData.get("orderId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!orderId) {
    throw new Error("Commande invalide.");
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
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
        refundRequests: true,
      },
    });

    if (!order) {
      throw new Error("Commande introuvable.");
    }

    if (order.status === "REFUNDED") {
      throw new Error("Cette commande est déjà remboursée.");
    }

    const alreadyProcessedRefund = order.refundRequests.find(
      (refund) => refund.status === "PROCESSED",
    );

    if (alreadyProcessedRefund) {
      throw new Error("Un remboursement a déjà été traité.");
    }

    const checkedInTicket = order.items
      .flatMap((item) => item.tickets)
      .find((ticket) => ticket.status === "CHECKED_IN");

    if (checkedInTicket) {
      throw new Error("Impossible de rembourser une commande avec billet déjà scanné.");
    }

    const paidAmount = order.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    if (paidAmount <= 0) {
      throw new Error("Aucun paiement encaissé à rembourser.");
    }

    for (const payment of order.payments) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "REFUNDED",
        },
      });
    }

    for (const item of order.items) {
      for (const ticket of item.tickets) {
        if (
          ticket.status === "ISSUED" ||
          ticket.status === "RESERVED" ||
          ticket.status === "TRANSFERRED"
        ) {
          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              status: "REFUNDED",
            },
          });
        }
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "REFUNDED",
      },
    });

    await tx.refundRequest.create({
      data: {
        orderId: order.id,
        requestedByUserId: context.user.id,
        reviewedByUserId: context.user.id,
        reason: reason || "Remboursement traité par l’administration en local.",
        status: "PROCESSED",
        requestedAmount: paidAmount,
        approvedAmount: paidAmount,
        processedAt: new Date(),
      },
    });
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/refunds");
  revalidatePath("/agency/analytics");
  revalidatePath("/account/tickets");
  revalidatePath("/account/reservations");
}