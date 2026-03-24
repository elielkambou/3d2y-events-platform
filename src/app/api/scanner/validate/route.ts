import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { canAccessScanner } from "@/lib/permissions";
import {
  hashTicketQrToken,
  parseTicketQrToken,
} from "@/lib/ticketing";

export async function POST(request: Request) {
  const session = await getSession();

  if (!canAccessScanner(session)) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHORIZED", message: "Accès refusé." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as { rawToken?: string };
  const rawToken = body.rawToken?.trim();

  if (!rawToken) {
    return NextResponse.json(
      { ok: false, code: "INVALID", message: "QR manquant." },
      { status: 400 },
    );
  }

  const parsedToken = parseTicketQrToken(rawToken);

  if (!parsedToken) {
    return NextResponse.json(
      { ok: false, code: "INVALID", message: "QR invalide." },
      { status: 400 },
    );
  }

  const qrHash = hashTicketQrToken(rawToken);

  const ticket = await prisma.ticket.findUnique({
    where: { id: parsedToken.ticketId },
    include: {
      ticketType: true,
      occurrence: {
        include: {
          venue: true,
          event: {
            include: {
              agency: true,
            },
          },
        },
      },
      orderItem: {
        include: {
          order: true,
        },
      },
      checkIns: {
        orderBy: {
          checkedInAt: "desc",
        },
      },
    },
  });

  if (!ticket || ticket.qrTokenHash !== qrHash) {
    return NextResponse.json(
      { ok: false, code: "INVALID", message: "Billet introuvable ou QR invalide." },
      { status: 404 },
    );
  }

  const successCheckIn = ticket.checkIns.find((entry) => entry.result === "SUCCESS");

  if (successCheckIn || ticket.status === "CHECKED_IN") {
    await prisma.ticketCheckIn.create({
      data: {
        ticketId: ticket.id,
        checkedInByUserId: session?.userId,
        result: "ALREADY_USED",
        notes: "Tentative de second scan.",
      },
    });

    return NextResponse.json({
      ok: false,
      code: "ALREADY_USED",
      message: "Ce billet a déjà été scanné.",
      ticket: {
        id: ticket.id,
        serialNumber: ticket.serialNumber,
        holderName: ticket.holderName,
        holderEmail: ticket.holderEmail,
        eventTitle: ticket.occurrence.event.title,
        venueName: ticket.occurrence.venue.name,
      },
    });
  }

  if (ticket.status === "REFUNDED") {
    await prisma.ticketCheckIn.create({
      data: {
        ticketId: ticket.id,
        checkedInByUserId: session?.userId,
        result: "REFUNDED",
        notes: "Billet remboursé.",
      },
    });

    return NextResponse.json({
      ok: false,
      code: "REFUNDED",
      message: "Billet remboursé.",
    });
  }

  if (ticket.status === "CANCELLED") {
    await prisma.ticketCheckIn.create({
      data: {
        ticketId: ticket.id,
        checkedInByUserId: session?.userId,
        result: "CANCELLED",
        notes: "Billet annulé.",
      },
    });

    return NextResponse.json({
      ok: false,
      code: "CANCELLED",
      message: "Billet annulé.",
    });
  }

  if (ticket.status === "EXPIRED") {
    await prisma.ticketCheckIn.create({
      data: {
        ticketId: ticket.id,
        checkedInByUserId: session?.userId,
        result: "EXPIRED",
        notes: "Billet expiré.",
      },
    });

    return NextResponse.json({
      ok: false,
      code: "EXPIRED",
      message: "Billet expiré.",
    });
  }

  const checkedIn = await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "CHECKED_IN",
      },
    });

    const checkIn = await tx.ticketCheckIn.create({
      data: {
        ticketId: ticket.id,
        checkedInByUserId: session?.userId,
        result: "SUCCESS",
        notes: "Scan valide.",
      },
    });

    return checkIn;
  });

  if (ticket.status === "RESERVED") {
    await prisma.ticketCheckIn.create({
      data: {
        ticketId: ticket.id,
        checkedInByUserId: session?.userId,
        result: "INVALID",
        notes: "Billet réservé, solde non réglé.",
      },
    });

    return NextResponse.json({
      ok: false,
      code: "INVALID",
      message: "Billet réservé : solde non réglé.",
      ticket: {
        id: ticket.id,
        serialNumber: ticket.serialNumber,
        holderName: ticket.holderName,
        holderEmail: ticket.holderEmail,
        eventTitle: ticket.occurrence.event.title,
        venueName: ticket.occurrence.venue.name,
      },
    });
  }  }