import { prisma } from "@/lib/prisma/client";
import { getAdminContext } from "@/server/queries/admin";

export async function getAdminEventDeletionRequests() {
  const context = await getAdminContext();

  if (!context) return null;

  const requests = await prisma.eventDeletionRequest.findMany({
    include: {
      event: {
        include: {
          category: true,
          agency: true,
        },
      },
      agency: true,
      requestedBy: true,
      reviewedBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    context,
    requests,
  };
}