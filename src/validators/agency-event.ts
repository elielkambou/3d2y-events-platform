import { z } from "zod";

export const createAgencyEventSchema = z.object({
  title: z.string().min(3, "Titre trop court"),
  slug: z
    .string()
    .min(3, "Slug trop court")
    .regex(/^[a-z0-9-]+$/, "Slug invalide"),
  shortDescription: z.string().min(10, "Description courte trop courte"),
  fullDescription: z.string().min(20, "Description complète trop courte"),
  categoryId: z.string().min(1, "Catégorie requise"),
  coverImageUrl: z.string().url("URL de couverture invalide"),
  venueId: z.string().min(1, "Lieu requis"),
  startsAt: z.string().min(1, "Date de début requise"),
  endsAt: z.string().min(1, "Date de fin requise"),
  salesStartAt: z.string().min(1, "Début de vente requis"),
  salesEndAt: z.string().min(1, "Fin de vente requise"),
  reservationEndAt: z.string().min(1, "Fin de réservation requise"),
  capacity: z.coerce.number().int().positive("Capacité invalide"),
  ticketName: z.string().min(2, "Nom du billet requis"),
  ticketDescription: z.string().min(2, "Description du billet requise"),
  ticketPriceAmount: z.coerce.number().positive("Prix invalide"),
  ticketTotalStock: z.coerce.number().int().positive("Stock invalide"),
  ticketMaxPerOrder: z.coerce.number().int().positive("Max/commande invalide"),
  isReservable: z.coerce.boolean().default(false),
  depositPercent: z.coerce.number().min(0).max(100).optional(),
  gracePeriodHours: z.coerce.number().int().min(0).optional(),
});