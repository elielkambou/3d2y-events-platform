"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { getAdminContext } from "@/server/queries/admin";

async function ensureAdmin() {
  const context = await getAdminContext();

  if (!context) {
    throw new Error("Accès admin invalide.");
  }

  return context;
}

export async function approveEventAction(formData: FormData) {
  const context = await ensureAdmin();

  const eventId = String(formData.get("eventId") ?? "");
  const comment = String(formData.get("comment") ?? "");

  if (!eventId) {
    throw new Error("Event ID manquant.");
  }

  await prisma.$transaction(async (tx) => {
    const current = await tx.event.findUnique({
      where: { id: eventId },
      select: { status: true },
    });

    if (!current) {
      throw new Error("Événement introuvable.");
    }

    if (current.status === "APPROVED") {
      throw new Error("Cet événement est déjà approuvé.");
    }
    if (current.status === "REJECTED") {
      throw new Error("Cet événement est déjà rejeté.");
    }
    if (current.status === "PUBLISHED") {
      throw new Error("Cet événement est déjà publié.");
    }

    await tx.event.update({
      where: { id: eventId },
      data: {
        status: "APPROVED",
      },
    });

    await tx.eventApproval.create({
      data: {
        eventId,
        reviewedByUserId: context.user.id,
        status: "APPROVED",
        comment: comment || "Événement approuvé par l’administration.",
      },
    });
  });

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/agency/events");
}

export async function rejectEventAction(formData: FormData) {
  const context = await ensureAdmin();

  const eventId = String(formData.get("eventId") ?? "");
  const comment = String(formData.get("comment") ?? "");

  if (!eventId) {
    throw new Error("Event ID manquant.");
  }

  await prisma.$transaction(async (tx) => {
    const current = await tx.event.findUnique({
      where: { id: eventId },
      select: { status: true },
    });

    if (!current) {
      throw new Error("Événement introuvable.");
    }

    if (current.status === "REJECTED") {
      throw new Error("Cet événement est déjà rejeté.");
    }
    if (current.status === "APPROVED") {
      throw new Error("Cet événement est déjà approuvé.");
    }
    if (current.status === "PUBLISHED") {
      throw new Error("Cet événement est déjà publié.");
    }

    await tx.event.update({
      where: { id: eventId },
      data: {
        status: "REJECTED",
        isPublished: false,
        publishedAt: null,
      },
    });

    await tx.eventApproval.create({
      data: {
        eventId,
        reviewedByUserId: context.user.id,
        status: "REJECTED",
        comment: comment || "Événement rejeté par l’administration.",
      },
    });
  });

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/agency/events");
}

export async function publishApprovedEventAction(formData: FormData) {
  await ensureAdmin();

  const eventId = String(formData.get("eventId") ?? "");

  if (!eventId) {
    throw new Error("Event ID manquant.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: eventId },
      data: {
        status: "PUBLISHED",
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    await tx.eventOccurrence.updateMany({
      where: {
        eventId,
        status: "DRAFT",
      },
      data: {
        status: "PUBLISHED",
      },
    });

    await tx.ticketType.updateMany({
      where: {
        occurrence: {
          eventId,
        },
        status: "DRAFT",
      },
      data: {
        status: "ACTIVE",
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/agency/events");

  redirect(`/admin/events/${eventId}`);
}