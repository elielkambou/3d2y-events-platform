import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";

export async function getCurrentUserReservations() {
  const session = await getSession();

  if (!session) return null;

  const orders = await prisma.order.findMany({
    where: {
      userId: session.userId,
      status: {
        in: ["PARTIALLY_PAID", "REFUNDED"],
      },
    },
    include: {
      payments: {
        where: {
          status: "SUCCEEDED",
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      items: {
        include: {
          occurrence: {
            include: {
              venue: true,
              event: {
                include: {
                  agency: true,
                },
              },
            },
          },
          ticketType: true,
          tickets: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    session,
    orders,
  };
}