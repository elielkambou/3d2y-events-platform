"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { canAccessAdmin, canManageAgency } from "@/lib/permissions";

function revalidateEventPaths(eventSlug?: string | null) {
  revalidatePath("/explore");
  revalidatePath("/");
  revalidatePath("/agency");
  revalidatePath("/agency/events");
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath("/admin/deletion-requests");

  if (eventSlug) {
    revalidatePath(`/events/${eventSlug}`);
  }
}

export async function requestEventDeletionAction(formData: FormData) {
  const session = await getSession();

  if (!canManageAgency(session)) {
    redirect("/login");
  }

  const eventId = String(formData.get("eventId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!eventId) {
    throw new Error("Événement invalide.");
  }

  if (reason.length < 10) {
    throw new Error("Le motif de suppression doit contenir au moins 10 caractères.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session!.userId },
    include: {
      agency: true,
    },
  });

  if (!user?.agency) {
    throw new Error("Agence introuvable.");
  }

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      agencyId: user.agency.id,
    },
    include: {
      deletionRequests: {
        where: {
          status: "PENDING",
        },
      },
    },
  });

  if (!event) {
    throw new Error("Événement introuvable.");
  }

  if (event.isDeleted) {
    throw new Error("Cet événement est déjà supprimé.");
  }

  if (event.deletionRequests.length > 0) {
    throw new Error("Une demande de suppression est déjà en attente.");
  }

  await prisma.eventDeletionRequest.create({
    data: {
      eventId: event.id,
      agencyId: user.agency.id,
      requestedByUserId: user.id,
      reason,
      status: "PENDING",
    },
  });

  revalidateEventPaths(event.slug);
  redirect("/agency/events?deletionRequested=1");
}

export async function approveEventDeletionRequestAction(formData: FormData) {
  const session = await getSession();

  if (!canAccessAdmin(session)) {
    redirect("/login");
  }

  const requestId = String(formData.get("requestId") ?? "");
  const adminComment = String(formData.get("adminComment") ?? "").trim();

  if (!requestId) {
    throw new Error("Demande invalide.");
  }

  const request = await prisma.eventDeletionRequest.findUnique({
    where: { id: requestId },
    include: {
      event: true,
    },
  });

  if (!request) {
    throw new Error("Demande introuvable.");
  }

  if (request.status !== "PENDING") {
    throw new Error("Cette demande a déjà été traitée.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.eventDeletionRequest.update({
      where: { id: request.id },
      data: {
        status: "APPROVED",
        reviewedByUserId: session!.userId,
        reviewedAt: new Date(),
        adminComment: adminComment || null,
      },
    });

    await tx.event.update({
      where: { id: request.eventId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedByUserId: session!.userId,
        deletionReason: request.reason,
        isPublished: false,
        publishedAt: null,
        status: "ARCHIVED",
      },
    });
  });

  revalidateEventPaths(request.event.slug);
  redirect("/admin/deletion-requests?approved=1");
}

export async function rejectEventDeletionRequestAction(formData: FormData) {
  const session = await getSession();

  if (!canAccessAdmin(session)) {
    redirect("/login");
  }

  const requestId = String(formData.get("requestId") ?? "");
  const adminComment = String(formData.get("adminComment") ?? "").trim();

  if (!requestId) {
    throw new Error("Demande invalide.");
  }

  if (adminComment.length < 5) {
    throw new Error("Ajoute un commentaire admin pour expliquer le refus.");
  }

  const request = await prisma.eventDeletionRequest.findUnique({
    where: { id: requestId },
    include: {
      event: true,
    },
  });

  if (!request) {
    throw new Error("Demande introuvable.");
  }

  if (request.status !== "PENDING") {
    throw new Error("Cette demande a déjà été traitée.");
  }

  await prisma.eventDeletionRequest.update({
    where: { id: request.id },
    data: {
      status: "REJECTED",
      reviewedByUserId: session!.userId,
      reviewedAt: new Date(),
      adminComment,
    },
  });

  revalidateEventPaths(request.event.slug);
  redirect("/admin/deletion-requests?rejected=1");
}

export async function adminDeleteEventAction(formData: FormData) {
  const session = await getSession();

  if (!canAccessAdmin(session)) {
    redirect("/login");
  }

  const eventId = String(formData.get("eventId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!eventId) {
    throw new Error("Événement invalide.");
  }

  if (reason.length < 10) {
    throw new Error("Le motif de suppression doit contenir au moins 10 caractères.");
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error("Événement introuvable.");
  }

  if (event.isDeleted) {
    throw new Error("Cet événement est déjà supprimé.");
  }

  await prisma.event.update({
    where: { id: event.id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedByUserId: session!.userId,
      deletionReason: reason,
      isPublished: false,
      publishedAt: null,
      status: "ARCHIVED",
    },
  });

  revalidateEventPaths(event.slug);
  redirect("/admin/events?deleted=1");
}