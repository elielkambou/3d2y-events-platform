"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { createAgencyEventSchema } from "@/validators/agency-event";
import { getCurrentAgencyContext } from "@/server/queries/agency";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function detectVideoProvider(url: string) {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "YOUTUBE";
  if (lower.includes("vimeo.com")) return "VIMEO";
  return "DIRECT";
}

async function createVenueIfNeeded(data: {
  venueId?: string;
  newVenueName?: string;
  newVenueDistrict?: string;
  newVenueMunicipality?: string;
  newVenueAddressLine?: string;
}) {
  if (data.venueId) return data.venueId;

  const newVenueName = data.newVenueName?.trim();
  if (!newVenueName) {
    throw new Error("Aucun lieu valide fourni.");
  }

  const baseSlug = slugify(newVenueName);
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.venue.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const venue = await prisma.venue.create({
    data: {
      name: newVenueName,
      slug,
      addressLine: data.newVenueAddressLine?.trim() || null,
      municipality: data.newVenueMunicipality?.trim() || null,
      district: data.newVenueDistrict?.trim() || null,
      city: "Abidjan",
      country: "Côte d'Ivoire",
    },
  });

  return venue.id;
}

export async function createAgencyEventAction(formData: FormData) {
  const context = await getCurrentAgencyContext();

  if (!context) {
    throw new Error("Accès agence invalide.");
  }

  const parsed = createAgencyEventSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription"),
    fullDescription: formData.get("fullDescription"),
    categoryId: formData.get("categoryId"),
    coverImageUrl: formData.get("coverImageUrl"),
    promoVideoUrl: formData.get("promoVideoUrl") || undefined,
    promoVideoPosterUrl: formData.get("promoVideoPosterUrl") || undefined,
    venueId: formData.get("venueId") || undefined,
    newVenueName: formData.get("newVenueName") || undefined,
    newVenueDistrict: formData.get("newVenueDistrict") || undefined,
    newVenueMunicipality: formData.get("newVenueMunicipality") || undefined,
    newVenueAddressLine: formData.get("newVenueAddressLine") || undefined,
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    salesStartAt: formData.get("salesStartAt"),
    salesEndAt: formData.get("salesEndAt"),
    reservationEndAt: formData.get("reservationEndAt"),
    capacity: formData.get("capacity"),
    ticketName: formData.get("ticketName"),
    ticketDescription: formData.get("ticketDescription"),
    ticketPriceAmount: formData.get("ticketPriceAmount"),
    ticketTotalStock: formData.get("ticketTotalStock"),
    ticketMaxPerOrder: formData.get("ticketMaxPerOrder"),
    isReservable: formData.get("isReservable") === "on",
    depositPercent:
      formData.get("depositPercent") === ""
        ? undefined
        : formData.get("depositPercent"),
    gracePeriodHours:
      formData.get("gracePeriodHours") === ""
        ? undefined
        : formData.get("gracePeriodHours"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
  }

  const data = parsed.data;

  const existingEvent = await prisma.event.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });

  if (existingEvent) {
    throw new Error("Ce slug est déjà utilisé.");
  }

  const venueId = await createVenueIfNeeded({
    venueId: data.venueId,
    newVenueName: data.newVenueName,
    newVenueDistrict: data.newVenueDistrict,
    newVenueMunicipality: data.newVenueMunicipality,
    newVenueAddressLine: data.newVenueAddressLine,
  });

  const promoVideoUrl = data.promoVideoUrl?.trim();
  const promoVideoPosterUrl = data.promoVideoPosterUrl?.trim();

  await prisma.event.create({
    data: {
      agencyId: context.agency.id,
      categoryId: data.categoryId,
      title: data.title,
      slug: data.slug,
      shortDescription: data.shortDescription,
      fullDescription: data.fullDescription,
      coverImageUrl: data.coverImageUrl,
      promoVideoUrl: data.promoVideoUrl || null,
      status: "SUBMITTED",
      isPublished: false,
      isFeatured: false,
      defaultCurrency: "XOF",
      mediaAssets: {
        create: [
          {
            mediaType: "IMAGE",
            url: data.coverImageUrl,
            altText: `Affiche de ${data.title}`,
            sortOrder: 0,
          },
          ...(promoVideoUrl
            ? [
                {
                  mediaType: "VIDEO" as const,
                  url: promoVideoUrl,
                  provider: detectVideoProvider(promoVideoUrl),
                  posterUrl: promoVideoPosterUrl || data.coverImageUrl,
                  altText: `Vidéo promotionnelle de ${data.title}`,
                  sortOrder: 1,
                },
              ]
            : []),
        ],
      },
      occurrences: {
        create: [
          {
            title: "Date principale",
            venueId,
            startsAt: new Date(data.startsAt),
            endsAt: new Date(data.endsAt),
            salesStartAt: new Date(data.salesStartAt),
            salesEndAt: new Date(data.salesEndAt),
            reservationEndAt: new Date(data.reservationEndAt),
            timezone: "Africa/Abidjan",
            capacity: data.capacity,
            status: "DRAFT",
            ticketTypes: {
              create: [
                {
                  name: data.ticketName,
                  description: data.ticketDescription,
                  priceAmount: data.ticketPriceAmount,
                  currency: "XOF",
                  totalStock: data.ticketTotalStock,
                  maxPerOrder: data.ticketMaxPerOrder,
                  isReservable: data.isReservable,
                  saleStartsAt: new Date(data.salesStartAt),
                  saleEndsAt: new Date(data.salesEndAt),
                  status: "DRAFT",
                  reservationPolicy: data.isReservable
                    ? {
                        create: {
                          isEnabled: true,
                          depositPercent: data.depositPercent ?? 0,
                          gracePeriodHours: data.gracePeriodHours ?? 0,
                        },
                      }
                    : undefined,
                },
              ],
            },
          },
        ],
      },
      approvals: {
        create: [
          {
            status: "PENDING",
            comment: "Soumis par l’agence pour validation.",
          },
        ],
      },
    },
  });

  redirect("/agency/events");
}