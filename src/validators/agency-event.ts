import { z } from "zod";

const dateTimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export const createAgencyEventSchema = z
  .object({
    title: z.string().min(3, "Le titre doit contenir au moins 3 caractères."),
    slug: z
      .string()
      .min(3, "Le slug doit contenir au moins 3 caractères.")
      .regex(/^[a-z0-9-]+$/, "Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets."),
    shortDescription: z
      .string()
      .min(20, "La description courte doit contenir au moins 20 caractères."),
    fullDescription: z.string().superRefine((value, ctx) => {
      const words = countWords(value);
      if (words < 100) {
        ctx.addIssue({
          code: "custom",
          message: `La description complète doit contenir au moins 100 mots. (${words}/100)`,
        });
      }
    }),
    categoryId: z.string().min(1, "La catégorie est obligatoire."),
    coverImageUrl: z.string().url("L’URL de l’image de couverture est invalide."),

    venueId: z.string().optional(),
    newVenueName: z.string().optional(),
    newVenueDistrict: z.string().optional(),
    newVenueMunicipality: z.string().optional(),
    newVenueAddressLine: z.string().optional(),

    startsAt: z
      .string()
      .regex(
        dateTimeLocalRegex,
        "Date de début invalide. Format attendu : AAAA-MM-JJTHH:MM",
      ),
    endsAt: z
      .string()
      .regex(
        dateTimeLocalRegex,
        "Date de fin invalide. Format attendu : AAAA-MM-JJTHH:MM",
      ),
    salesStartAt: z
      .string()
      .regex(
        dateTimeLocalRegex,
        "Début des ventes invalide. Format attendu : AAAA-MM-JJTHH:MM",
      ),
    salesEndAt: z
      .string()
      .regex(
        dateTimeLocalRegex,
        "Fin des ventes invalide. Format attendu : AAAA-MM-JJTHH:MM",
      ),
    reservationEndAt: z
      .string()
      .regex(
        dateTimeLocalRegex,
        "Fin de réservation invalide. Format attendu : AAAA-MM-JJTHH:MM",
      ),

    capacity: z.coerce.number().int().positive("La capacité doit être supérieure à 0."),
    ticketName: z.string().min(2, "Le nom du billet est obligatoire."),
    ticketDescription: z.string().min(2, "La description du billet est obligatoire."),
    ticketPriceAmount: z.coerce.number().positive("Le prix doit être supérieur à 0."),
    ticketTotalStock: z.coerce.number().int().positive("Le stock doit être supérieur à 0."),
    ticketMaxPerOrder: z.coerce.number().int().positive("Le max par commande doit être supérieur à 0."),
    isReservable: z.coerce.boolean().default(false),
    depositPercent: z.coerce.number().min(0).max(100).optional(),
    gracePeriodHours: z.coerce.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.venueId && !data.newVenueName?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["venueId"],
        message: "Choisis un lieu existant ou ajoute un nouveau lieu.",
      });
    }

    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);
    const salesStartAt = new Date(data.salesStartAt);
    const salesEndAt = new Date(data.salesEndAt);
    const reservationEndAt = new Date(data.reservationEndAt);

    if (endsAt <= startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "La date de fin doit être après la date de début.",
      });
    }

    if (salesEndAt <= salesStartAt) {
      ctx.addIssue({
        code: "custom",
        path: ["salesEndAt"],
        message: "La fin des ventes doit être après le début des ventes.",
      });
    }

    if (reservationEndAt > startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["reservationEndAt"],
        message: "La fin de réservation doit être antérieure au début de l’événement.",
      });
    }
  });