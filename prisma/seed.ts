import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  UserRole,
  AgencyStatus,
  EventStatus,
  OccurrenceStatus,
  TicketTypeStatus,
  ApprovalStatus,
} from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

async function main() {
  const categories = [
    {
      name: "Concerts",
      slug: "concerts",
      description: "Concerts live, showcases et performances musicales",
    },
    {
      name: "Gastronomie",
      slug: "gastronomie",
      description: "Expériences culinaires et découvertes food",
    },
    {
      name: "Nightlife",
      slug: "nightlife",
      description: "Soirées, clubs et événements nocturnes",
    },
    {
      name: "Culture",
      slug: "culture",
      description: "Expositions, patrimoine, événements culturels",
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  const venues = [
    {
      name: "Palais de la Culture",
      slug: "palais-de-la-culture",
      addressLine: "Treichville",
      municipality: "Treichville",
      district: "Treichville",
      city: "Abidjan",
      country: "Côte d'Ivoire",
      latitude: "5.2994",
      longitude: "-4.0127",
    },
    {
      name: "Zone 4 Rooftop",
      slug: "zone-4-rooftop",
      addressLine: "Zone 4",
      municipality: "Marcory",
      district: "Zone 4",
      city: "Abidjan",
      country: "Côte d'Ivoire",
      latitude: "5.2810",
      longitude: "-3.9720",
    },
    {
      name: "Sofitel Abidjan Hôtel Ivoire",
      slug: "sofitel-hotel-ivoire",
      addressLine: "Boulevard Hassan II",
      municipality: "Cocody",
      district: "Cocody",
      city: "Abidjan",
      country: "Côte d'Ivoire",
      latitude: "5.3364",
      longitude: "-3.9985",
    },
  ];

  for (const venue of venues) {
    await prisma.venue.upsert({
      where: { slug: venue.slug },
      update: venue,
      create: venue,
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@3d2y.local" },
    update: {
      fullName: "3D2Y Super Admin",
      isActive: true,
    },
    create: {
      email: "admin@3d2y.local",
      fullName: "3D2Y Super Admin",
      isActive: true,
      isEmailVerified: true,
    },
  });

  const agencyOwner = await prisma.user.upsert({
    where: { email: "agency@lagune.local" },
    update: {
      fullName: "Lagune Events",
      isActive: true,
    },
    create: {
      email: "agency@lagune.local",
      fullName: "Lagune Events",
      isActive: true,
      isEmailVerified: true,
    },
  });

  const scannerUser = await prisma.user.upsert({
    where: { email: "scanner@lagune.local" },
    update: {
      fullName: "Scanner Lagune",
      isActive: true,
    },
    create: {
      email: "scanner@lagune.local",
      fullName: "Scanner Lagune",
      isActive: true,
      isEmailVerified: true,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "client@test.local" },
    update: {
      fullName: "Client Test",
      isActive: true,
    },
    create: {
      email: "client@test.local",
      fullName: "Client Test",
      isActive: true,
      isEmailVerified: true,
    },
  });

  const roleAssignments = [
    { userId: admin.id, role: UserRole.SUPER_ADMIN },
    { userId: admin.id, role: UserRole.CONTENT_ADMIN },
    { userId: admin.id, role: UserRole.FINANCE_ADMIN },
    { userId: agencyOwner.id, role: UserRole.AGENCY },
    { userId: scannerUser.id, role: UserRole.AGENCY_SCANNER },
    { userId: customer.id, role: UserRole.CUSTOMER },
  ];

  for (const assignment of roleAssignments) {
    await prisma.userRoleAssignment.upsert({
      where: {
        userId_role: {
          userId: assignment.userId,
          role: assignment.role,
        },
      },
      update: {},
      create: assignment,
    });
  }

  const agency = await prisma.agency.upsert({
    where: { slug: "lagune-events" },
    update: {
      name: "Lagune Events",
      email: "contact@lagune.local",
      phone: "+2250700000000",
      description:
        "Agence événementielle premium spécialisée dans les expériences lifestyle à Abidjan.",
      status: AgencyStatus.ACTIVE,
      isVerified: true,
      commissionRateBps: 1200,
      ownerUserId: agencyOwner.id,
    },
    create: {
      ownerUserId: agencyOwner.id,
      name: "Lagune Events",
      slug: "lagune-events",
      email: "contact@lagune.local",
      phone: "+2250700000000",
      description:
        "Agence événementielle premium spécialisée dans les expériences lifestyle à Abidjan.",
      status: AgencyStatus.ACTIVE,
      isVerified: true,
      commissionRateBps: 1200,
    },
  });

  const nightlifeCategory = await prisma.category.findUniqueOrThrow({
    where: { slug: "nightlife" },
  });

  const gastronomieCategory = await prisma.category.findUniqueOrThrow({
    where: { slug: "gastronomie" },
  });

  const rooftopVenue = await prisma.venue.findUniqueOrThrow({
    where: { slug: "zone-4-rooftop" },
  });

  const sofitelVenue = await prisma.venue.findUniqueOrThrow({
    where: { slug: "sofitel-hotel-ivoire" },
  });

  const publishedEvent = await prisma.event.findUnique({
    where: { slug: "soiree-lagune-live" },
  });

  if (!publishedEvent) {
    await prisma.event.create({
      data: {
        agencyId: agency.id,
        categoryId: nightlifeCategory.id,
        title: "Soirée Lagune Live",
        slug: "soiree-lagune-live",
        shortDescription: "Une soirée premium entre musique, rooftop et ambiance Abidjan.",
        fullDescription:
          "Événement test local pour valider la structure de la plateforme, les occurrences, les billets et le workflow agence/admin.",
        coverImageUrl:
          "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
        status: EventStatus.PUBLISHED,
        isPublished: true,
        isFeatured: true,
        defaultCurrency: "XOF",
        publishedAt: new Date(),
        mediaAssets: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
              altText: "Concert premium",
              sortOrder: 0,
            },
          ],
        },
        occurrences: {
          create: [
            {
              venueId: rooftopVenue.id,
              title: "Opening Night",
              startsAt: new Date("2026-06-20T19:00:00.000Z"),
              endsAt: new Date("2026-06-21T02:00:00.000Z"),
              salesStartAt: new Date("2026-03-25T08:00:00.000Z"),
              salesEndAt: new Date("2026-06-20T16:00:00.000Z"),
              reservationEndAt: new Date("2026-06-15T23:59:59.000Z"),
              timezone: "Africa/Abidjan",
              capacity: 300,
              status: OccurrenceStatus.PUBLISHED,
              ticketTypes: {
                create: [
                  {
                    name: "Standard",
                    description: "Accès standard",
                    priceAmount: "15000",
                    currency: "XOF",
                    totalStock: 200,
                    maxPerOrder: 6,
                    isReservable: true,
                    saleStartsAt: new Date("2026-03-25T08:00:00.000Z"),
                    saleEndsAt: new Date("2026-06-20T16:00:00.000Z"),
                    status: TicketTypeStatus.ACTIVE,
                    reservationPolicy: {
                      create: {
                        isEnabled: true,
                        depositPercent: "30.00",
                        gracePeriodHours: 72,
                      },
                    },
                  },
                  {
                    name: "VIP",
                    description: "Accès VIP + espace réservé",
                    priceAmount: "40000",
                    currency: "XOF",
                    totalStock: 100,
                    maxPerOrder: 4,
                    isReservable: true,
                    saleStartsAt: new Date("2026-03-25T08:00:00.000Z"),
                    saleEndsAt: new Date("2026-06-20T16:00:00.000Z"),
                    status: TicketTypeStatus.ACTIVE,
                    reservationPolicy: {
                      create: {
                        isEnabled: true,
                        depositPercent: "40.00",
                        gracePeriodHours: 48,
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
        approvals: {
          create: [
            {
              status: ApprovalStatus.APPROVED,
              reviewedByUserId: admin.id,
              comment: "Événement de démonstration approuvé en local.",
            },
          ],
        },
      },
    });
  }

  const submittedEvent = await prisma.event.findUnique({
    where: { slug: "abidjan-food-sessions" },
  });

  if (!submittedEvent) {
    await prisma.event.create({
      data: {
        agencyId: agency.id,
        categoryId: gastronomieCategory.id,
        title: "Abidjan Food Sessions",
        slug: "abidjan-food-sessions",
        shortDescription: "Expérience food & networking en hôtel premium.",
        fullDescription:
          "Événement en attente de validation admin pour tester le workflow de soumission.",
        coverImageUrl:
          "https://images.unsplash.com/photo-1559339352-11d035aa65de",
        status: EventStatus.SUBMITTED,
        isPublished: false,
        isFeatured: false,
        defaultCurrency: "XOF",
        occurrences: {
          create: [
            {
              venueId: sofitelVenue.id,
              title: "Session unique",
              startsAt: new Date("2026-07-10T18:30:00.000Z"),
              endsAt: new Date("2026-07-10T23:00:00.000Z"),
              salesStartAt: new Date("2026-04-01T08:00:00.000Z"),
              salesEndAt: new Date("2026-07-10T14:00:00.000Z"),
              reservationEndAt: new Date("2026-07-05T23:59:59.000Z"),
              timezone: "Africa/Abidjan",
              capacity: 120,
              status: OccurrenceStatus.DRAFT,
              ticketTypes: {
                create: [
                  {
                    name: "Pass découverte",
                    description: "Entrée simple",
                    priceAmount: "25000",
                    currency: "XOF",
                    totalStock: 120,
                    maxPerOrder: 4,
                    isReservable: true,
                    saleStartsAt: new Date("2026-04-01T08:00:00.000Z"),
                    saleEndsAt: new Date("2026-07-10T14:00:00.000Z"),
                    status: TicketTypeStatus.DRAFT,
                    reservationPolicy: {
                      create: {
                        isEnabled: true,
                        depositPercent: "25.00",
                        gracePeriodHours: 72,
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
        approvals: {
          create: [
            {
              status: ApprovalStatus.PENDING,
              comment: "Soumis pour validation admin.",
            },
          ],
        },
      },
    });
  }

  console.log("✅ Seed terminé avec succès");
}

main()
  .catch((error) => {
    console.error("❌ Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });