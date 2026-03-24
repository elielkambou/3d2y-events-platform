import { z } from "zod";

export const createCheckoutOrderSchema = z.object({
  ticketTypeId: z.string().min(1, "Billet invalide"),
  quantity: z.coerce.number().int().min(1).max(10),
});