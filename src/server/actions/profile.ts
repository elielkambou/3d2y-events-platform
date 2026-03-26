"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { canManageAgency } from "@/lib/permissions";
import {
  updateAgencyProfileSchema,
  updateUserProfileSchema,
} from "@/validators/profile";

export async function updateUserProfileAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const parsed = updateUserProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    avatarUrl: formData.get("avatarUrl"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  }

  const data = parsed.data;

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      fullName: data.fullName,
      phone: data.phone || null,
      avatarUrl: data.avatarUrl || null,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");

  redirect("/account/profile?updated=1");
}

export async function updateAgencyProfileAction(formData: FormData) {
  const session = await getSession();

  if (!canManageAgency(session)) {
    redirect("/login");
  }

  const parsed = updateAgencyProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    description: formData.get("description"),
    logoUrl: formData.get("logoUrl"),
    coverImageUrl: formData.get("coverImageUrl"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  }

  const data = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session!.userId },
    include: {
      agency: true,
    },
  });

  if (!user?.agency) {
    throw new Error("Agence introuvable.");
  }

  await prisma.agency.update({
    where: { id: user.agency.id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      description: data.description || null,
      logoUrl: data.logoUrl || null,
      coverImageUrl: data.coverImageUrl || null,
    },
  });

  revalidatePath("/agency");
  revalidatePath("/agency/profile");
  revalidatePath("/agency/events");
  revalidatePath("/explore");

  redirect("/agency/profile?updated=1");
}