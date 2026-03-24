import { prisma } from "@/lib/prisma/client";
import { getAdminContext } from "@/server/queries/admin";

export async function getAdminOrders() {
  const context = await getAdminContext();

  if (!context) return null;

  const orders = await prisma.order.findMany({
    include: {
      user: true,
      agency: true,
      items: {
        include: {
          ticketType: true,
          occurrence: {
            include: {
              event: true,
              venue: true,
            },
          },
          tickets: true,
        },
      },
      payments: {
        orderBy: {
          createdAt: "asc",
        },
      },
      refundRequests: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    context,
    orders,
  };
}

export async function getAdminRefunds() {
  const context = await getAdminContext();

  if (!context) return null;

  const refunds = await prisma.refundRequest.findMany({
    include: {
      order: {
        include: {
          agency: true,
        },
      },
      ticket: {
        include: {
          occurrence: {
            include: {
              event: true,
            },
          },
        },
      },
      requestedBy: true,
      reviewedBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    context,
    refunds,
  };
}