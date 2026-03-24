import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/permissions";

export async function getAdminContext() {
  const session = await getSession();

  if (!canAccessAdmin(session)) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session!.userId },
    include: {
      roles: true,
    },
  });

  if (!user) return null;

  return {
    session,
    user,
  };
}

export async function getAdminSubmittedEvents() {
  const context = await getAdminContext();

  if (!context) return null;

  const events = await prisma.event.findMany({
    where: {
      status: {
        in: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"],
      },
    },
    include: {
      agency: true,
      category: true,
      occurrences: {
        include: {
          venue: true,
          ticketTypes: {
            include: {
              reservationPolicy: true,
            },
            orderBy: {
              priceAmount: "asc",
            },
          },
        },
        orderBy: {
          startsAt: "asc",
        },
      },
      approvals: {
        include: {
          reviewedBy: true,
        },
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
    events,
  };
}

export async function getAdminEventById(eventId: string) {
  const context = await getAdminContext();

  if (!context) return null;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      agency: true,
      category: true,
      mediaAssets: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      occurrences: {
        include: {
          venue: true,
          ticketTypes: {
            include: {
              reservationPolicy: true,
            },
            orderBy: {
              priceAmount: "asc",
            },
          },
        },
        orderBy: {
          startsAt: "asc",
        },
      },
      approvals: {
        include: {
          reviewedBy: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!event) return null;

  return {
    context,
    event,
  };
}