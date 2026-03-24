import { prisma } from "@/lib/prisma/client";
import { getCurrentAgencyContext } from "@/server/queries/agency";

export async function getAgencyAnalytics() {
  const context = await getCurrentAgencyContext();

  if (!context) return null;

  const agencyId = context.agency.id;

  const [
    totalEvents,
    publishedEvents,
    submittedEvents,
    totalOrders,
    paidOrders,
    grossSalesAgg,
    commissionAgg,
    netAgg,
    totalIssuedTickets,
    totalCheckedInTickets,
    recentOrders,
  ] = await Promise.all([
    prisma.event.count({
      where: {
        agencyId,
      },
    }),

    prisma.event.count({
      where: {
        agencyId,
        status: "PUBLISHED",
        isPublished: true,
      },
    }),

    prisma.event.count({
      where: {
        agencyId,
        status: {
          in: ["SUBMITTED", "UNDER_REVIEW", "APPROVED"],
        },
      },
    }),

    prisma.order.count({
      where: {
        agencyId,
      },
    }),

    prisma.order.count({
      where: {
        agencyId,
        status: {
          in: ["PAID", "PARTIALLY_PAID"],
        },
      },
    }),

    prisma.order.aggregate({
      where: {
        agencyId,
        status: {
          in: ["PAID", "PARTIALLY_PAID"],
        },
      },
      _sum: {
        subtotalAmount: true,
      },
    }),

    prisma.commissionLedger.aggregate({
      where: {
        agencyId,
      },
      _sum: {
        commissionAmount: true,
      },
    }),

    prisma.commissionLedger.aggregate({
      where: {
        agencyId,
      },
      _sum: {
        netAmount: true,
      },
    }),

    prisma.ticket.count({
      where: {
        occurrence: {
          event: {
            agencyId,
          },
        },
        status: {
          in: ["ISSUED", "CHECKED_IN", "TRANSFERRED"],
        },
      },
    }),

    prisma.ticketCheckIn.count({
      where: {
        ticket: {
          occurrence: {
            event: {
              agencyId,
            },
          },
        },
        result: "SUCCESS",
      },
    }),

    prisma.order.findMany({
      where: {
        agencyId,
      },
      include: {
        user: true,
        items: {
          include: {
            occurrence: {
              include: {
                event: true,
                venue: true,
              },
            },
            ticketType: true,
            tickets: true,
          },
        },
        payments: {
          where: {
            status: "SUCCEEDED",
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
  ]);

  return {
    agency: context.agency,
    stats: {
      totalEvents,
      publishedEvents,
      submittedEvents,
      totalOrders,
      paidOrders,
      grossSales: Number(grossSalesAgg._sum.subtotalAmount ?? 0),
      commissionTotal: Number(commissionAgg._sum.commissionAmount ?? 0),
      netTotal: Number(netAgg._sum.netAmount ?? 0),
      totalIssuedTickets,
      totalCheckedInTickets,
    },
    recentOrders: recentOrders.map((order) => {
      const firstItem = order.items[0] ?? null;
      const paidAmount = order.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );

      return {
        id: order.id,
        createdAt: order.createdAt.toISOString(),
        status: order.status,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        totalAmount: Number(order.totalAmount),
        paidAmount,
        itemCount: order.items.length,
        quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
        eventTitle: firstItem?.occurrence.event.title ?? "—",
        venueName: firstItem?.occurrence.venue.name ?? "—",
        ticketTypeName: firstItem?.ticketType.name ?? "—",
      };
    }),
  };
}