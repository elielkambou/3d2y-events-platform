import { z } from "zod";

export const createReservationSchema = z.object({
  ticketTypeId: z.string().min(1, "Billet invalide"),
  quantity: z.coerce.number().int().min(1).max(10),
});

export const payReservationBalanceSchema = z.object({
  orderId: z.string().min(1, "Commande invalide"),
});