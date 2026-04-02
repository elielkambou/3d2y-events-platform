import { prisma } from "@/lib/prisma/client";
import { buildTicketQrToken } from "@/lib/ticketing";

export async function getGuestOrderTickets(orderId: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!orderId || !normalizedEmail) return null;

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      customerEmail: normalizedEmail,
    },
    include: {
      items: {
        include: {
          occurrence: {
            include: {
              event: true,
              venue: true,
            },
          },
          ticketType: true,
          tickets: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    status: order.status,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      ticketType: {
        id: item.ticketType.id,
        name: item.ticketType.name,
      },
      occurrence: {
        id: item.occurrence.id,
        startsAt: item.occurrence.startsAt.toISOString(),
        event: {
          id: item.occurrence.event.id,
          title: item.occurrence.event.title,
          slug: item.occurrence.event.slug,
        },
        venue: {
          name: item.occurrence.venue.name,
          district: item.occurrence.venue.district,
        },
      },
      tickets: item.tickets.map((ticket) => ({
        id: ticket.id,
        serialNumber: ticket.serialNumber,
        status: ticket.status,
        holderName: ticket.holderName,
        holderEmail: ticket.holderEmail,
        issuedAt: ticket.issuedAt?.toISOString() ?? null,
        qrToken: buildTicketQrToken(ticket.id, ticket.serialNumber),
      })),
    })),
  };
}
