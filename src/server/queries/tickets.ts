import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";

export async function getCurrentUserTickets() {
  const session = await getSession();

  if (!session) return null;

  const tickets = await prisma.ticket.findMany({
    where: {
      orderItem: {
        order: {
          userId: session.userId,
        },
      },
    },
    include: {
      ticketType: true,
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
      orderItem: {
        include: {
          order: {
            include: {
              payments: {
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    session,
    tickets,
  };
}