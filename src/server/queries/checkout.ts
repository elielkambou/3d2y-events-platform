import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";

export async function getCheckoutPreview(params: {
  ticketTypeId: string;
  quantity: number;
  mode: "buy" | "reserve";
}) {
  const session = await getSession();

  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) return null;

  const ticketType = await prisma.ticketType.findUnique({
    where: { id: params.ticketTypeId },
    include: {
      reservationPolicy: true,
      occurrence: {
        include: {
          venue: true,
          event: {
            include: {
              agency: true,
              category: true,
            },
          },
        },
      },
    },
  });

  if (!ticketType) return null;

  const occurrence = ticketType.occurrence;
  const event = occurrence.event;
  const agency = event.agency;

  const unitPrice = Number(ticketType.priceAmount);
  const quantity = params.quantity;
  const subtotal = unitPrice * quantity;

  const commissionAmount = Math.round(
    (subtotal * agency.commissionRateBps) / 10000,
  );

  const depositPercent =
    params.mode === "reserve" && ticketType.reservationPolicy?.isEnabled
      ? Number(ticketType.reservationPolicy.depositPercent ?? 0)
      : 0;

  const amountDueNow =
    params.mode === "reserve"
      ? Math.max(0, Math.round((subtotal * depositPercent) / 100))
      : subtotal;

  const remainingAmount =
    params.mode === "reserve" ? subtotal - amountDueNow : 0;

  return {
    session,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    },
    mode: params.mode,
    ticketType: {
      id: ticketType.id,
      name: ticketType.name,
      description: ticketType.description,
      isReservable: ticketType.isReservable,
      maxPerOrder: ticketType.maxPerOrder,
    },
    occurrence: {
      id: occurrence.id,
      startsAt: occurrence.startsAt.toISOString(),
      endsAt: occurrence.endsAt.toISOString(),
      reservationEndAt: occurrence.reservationEndAt?.toISOString() ?? null,
      venue: {
        name: occurrence.venue.name,
        district: occurrence.venue.district,
        municipality: occurrence.venue.municipality,
        city: occurrence.venue.city,
      },
    },
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      shortDescription: event.shortDescription,
      coverImageUrl: event.coverImageUrl,
      agencyName: event.agency.name,
      categoryName: event.category?.name ?? null,
    },
    pricing: {
      unitPrice,
      quantity,
      subtotal,
      commissionAmount,
      depositPercent,
      amountDueNow,
      remainingAmount,
      currency: "XOF",
    },
  };
}