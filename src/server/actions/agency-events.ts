"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { createAgencyEventSchema } from "@/validators/agency-event";
import { getCurrentAgencyContext } from "@/server/queries/agency";

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
    venueId: formData.get("venueId"),
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

  await prisma.event.create({
    data: {
      agencyId: context.agency.id,
      categoryId: data.categoryId,
      title: data.title,
      slug: data.slug,
      shortDescription: data.shortDescription,
      fullDescription: data.fullDescription,
      coverImageUrl: data.coverImageUrl,
      status: "SUBMITTED",
      isPublished: false,
      isFeatured: false,
      defaultCurrency: "XOF",
      occurrences: {
        create: [
          {
            title: "Date principale",
            venueId: data.venueId,
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