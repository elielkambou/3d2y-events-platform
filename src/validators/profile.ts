import { z } from "zod";

export const updateUserProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Le nom complet doit contenir au moins 2 caractères.")
    .max(120, "Le nom complet est trop long."),
  phone: z
    .string()
    .trim()
    .max(30, "Le numéro est trop long.")
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .trim()
    .url("L’URL de l’avatar est invalide.")
    .optional()
    .or(z.literal("")),
});

export const updateAgencyProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom de l’agence doit contenir au moins 2 caractères.")
    .max(150, "Le nom de l’agence est trop long."),
  email: z
    .string()
    .trim()
    .email("L’email de l’agence est invalide."),
  phone: z
    .string()
    .trim()
    .max(30, "Le numéro est trop long.")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .min(20, "La description doit contenir au moins 20 caractères.")
    .max(1500, "La description est trop longue.")
    .optional()
    .or(z.literal("")),
  logoUrl: z
    .string()
    .trim()
    .url("L’URL du logo est invalide.")
    .optional()
    .or(z.literal("")),
  coverImageUrl: z
    .string()
    .trim()
    .url("L’URL de l’image de couverture est invalide.")
    .optional()
    .or(z.literal("")),
});