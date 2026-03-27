import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
export async function getHomepageData() {
  const [featuredEvents, categories] = await Promise.all([
    prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        isPublished: true,
        isDeleted: false,
      },
      include: {
        category: true,
        agency: true,
        occurrences: {
          where: {
            status: "PUBLISHED",
          },
          include: {
            venue: true,
            ticketTypes: {
              where: {
                status: "ACTIVE",
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
      },
      orderBy: [
        { isFeatured: "desc" },
        { publishedAt: "desc" },
      ],
      take: 6,
    }),
    prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return {
    featuredEvents: featuredEvents.map(mapEventCardData),
    categories,
  };
}

export async function getPublishedEvents() {
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      isPublished: true,
      isDeleted: false,
    },
    include: {
      category: true,
      agency: true,
      occurrences: {
        where: {
          status: "PUBLISHED",
        },
        include: {
          venue: true,
          ticketTypes: {
            where: {
              status: "ACTIVE",
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
    },
    orderBy: [
      { isFeatured: "desc" },
      { publishedAt: "desc" },
    ],
  });

  return events.map(mapEventCardData);
}

export async function getPublishedEventBySlug(slug: string) {
  const event = await prisma.event.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      isPublished: true,
      isDeleted: false,
    },
    include: {
      category: true,
      agency: true,
      mediaAssets: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      occurrences: {
        where: {
          status: "PUBLISHED",
        },
        include: {
          venue: true,
          ticketTypes: {
            where: {
              status: "ACTIVE",
            },
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
    },
  });

  if (!event) return null;

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    shortDescription: event.shortDescription,
    fullDescription: event.fullDescription,
    coverImageUrl: event.coverImageUrl,
    isFeatured: event.isFeatured,
    defaultCurrency: event.defaultCurrency,
    publishedAt: event.publishedAt?.toISOString() ?? null,
    category: event.category
      ? {
          name: event.category.name,
          slug: event.category.slug,
        }
      : null,
    agency: {
      name: event.agency.name,
      slug: event.agency.slug,
    },
    mediaAssets: event.mediaAssets.map((asset) => ({
      id: asset.id,
      url: asset.url,
      altText: asset.altText,
      sortOrder: asset.sortOrder,
    })),
    occurrences: event.occurrences.map((occurrence) => ({
      id: occurrence.id,
      title: occurrence.title,
      startsAt: occurrence.startsAt.toISOString(),
      endsAt: occurrence.endsAt.toISOString(),
      salesStartAt: occurrence.salesStartAt?.toISOString() ?? null,
      salesEndAt: occurrence.salesEndAt?.toISOString() ?? null,
      reservationEndAt: occurrence.reservationEndAt?.toISOString() ?? null,
      timezone: occurrence.timezone,
      capacity: occurrence.capacity,
      venue: {
        id: occurrence.venue.id,
        name: occurrence.venue.name,
        district: occurrence.venue.district,
        municipality: occurrence.venue.municipality,
        city: occurrence.venue.city,
        addressLine: occurrence.venue.addressLine,
      },
      ticketTypes: occurrence.ticketTypes.map((ticketType) => ({
        id: ticketType.id,
        name: ticketType.name,
        description: ticketType.description,
        priceAmount: Number(ticketType.priceAmount),
        currency: ticketType.currency,
        totalStock: ticketType.totalStock,
        maxPerOrder: ticketType.maxPerOrder,
        isReservable: ticketType.isReservable,
        reservationPolicy: ticketType.reservationPolicy
          ? {
              isEnabled: ticketType.reservationPolicy.isEnabled,
              depositPercent: ticketType.reservationPolicy.depositPercent
                ? Number(ticketType.reservationPolicy.depositPercent)
                : null,
              gracePeriodHours: ticketType.reservationPolicy.gracePeriodHours,
            }
          : null,
      })),
    })),
  };
}

type EventCardEvent = Prisma.EventGetPayload<{
  include: {
    category: true;
    agency: true;
    occurrences: {
      include: {
        venue: true;
        ticketTypes: true;
      };
    };
  };
}>;

function mapEventCardData(event: EventCardEvent) {
  const firstOccurrence = event.occurrences[0] ?? null;

  const minPrice =
    firstOccurrence && firstOccurrence.ticketTypes.length > 0
      ? Math.min(
          ...firstOccurrence.ticketTypes.map((ticket) =>
            Number(ticket.priceAmount),
          ),
        )
      : null;

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    shortDescription: event.shortDescription,
    coverImageUrl: event.coverImageUrl,
    isFeatured: event.isFeatured,
    category: event.category
      ? {
          name: event.category.name,
          slug: event.category.slug,
        }
      : null,
    agency: {
      name: event.agency.name,
      slug: event.agency.slug,
    },
    firstOccurrence: firstOccurrence
      ? {
          id: firstOccurrence.id,
          title: firstOccurrence.title,
          startsAt: firstOccurrence.startsAt.toISOString(),
          venueName: firstOccurrence.venue.name,
          district: firstOccurrence.venue.district,
          city: firstOccurrence.venue.city,
        }
      : null,
    minPrice,
    currency: event.defaultCurrency,
  };
}