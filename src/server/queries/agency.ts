import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export async function getCurrentAgencyContext() {
  const session = await getSession();

  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      agency: true,
      roles: true,
    },
  });

  if (!user?.agency) return null;

  return {
    session,
    user,
    agency: user.agency,
  };
}

export async function getAgencyEvents() {
  const context = await getCurrentAgencyContext();

  if (!context) return null;

  const events = await prisma.event.findMany({
    where: {
      agencyId: context.agency.id,
    },
    include: {
      category: true,
      occurrences: {
        include: {
          venue: true,
          ticketTypes: true,
        },
        orderBy: {
          startsAt: "asc",
        },
      },
      approvals: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      deletionRequests: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  return {
    agency: context.agency,
    events,
  };
}