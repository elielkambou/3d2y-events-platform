import { NextResponse } from "next/server";
import { formatEventDate } from "@/lib/formatters";
import { getGuestOrderTickets } from "@/server/queries/guest-tickets";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticketId = searchParams.get("ticketId") ?? "";
  const orderId = searchParams.get("orderId") ?? "";
  const email = searchParams.get("email") ?? "";

  if (!ticketId || !orderId || !email) {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }

  const order = await getGuestOrderTickets(orderId, email);
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }

  const ticketEntry = order.items
    .flatMap((item) =>
      item.tickets.map((ticket) => ({
        item,
        ticket,
      })),
    )
    .find((entry) => entry.ticket.id === ticketId);

  if (!ticketEntry) {
    return NextResponse.json({ error: "Billet introuvable." }, { status: 404 });
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const qrDataUrl = await QRCode.toDataURL(ticketEntry.ticket.qrToken, {
    margin: 1,
    width: 512,
  });
  const qrBase64 = qrDataUrl.split(",")[1];
  const qrBytes = Uint8Array.from(Buffer.from(qrBase64, "base64"));
  const qrImage = await pdfDoc.embedPng(qrBytes);

  const left = 50;
  let y = 790;
  const lineHeight = 24;

  page.drawText("3D2Y EVENTS - BILLET D'ENTREE", {
    x: left,
    y,
    size: 20,
    font: boldFont,
    color: rgb(0.12, 0.12, 0.12),
  });
  y -= 40;

  const lines = [
    `Commande: ${order.id}`,
    `Nom: ${ticketEntry.ticket.holderName ?? order.customerName ?? "Client"}`,
    `Email: ${ticketEntry.ticket.holderEmail ?? order.customerEmail}`,
    `Événement: ${ticketEntry.item.occurrence.event.title}`,
    `Billet: ${ticketEntry.item.ticketType.name}`,
    `Date: ${formatEventDate(ticketEntry.item.occurrence.startsAt)}`,
    `Lieu: ${ticketEntry.item.occurrence.venue.name}${ticketEntry.item.occurrence.venue.district ? ` · ${ticketEntry.item.occurrence.venue.district}` : ""}`,
    `N° billet: ${ticketEntry.ticket.serialNumber}`,
  ];

  for (const line of lines) {
    page.drawText(line, {
      x: left,
      y,
      size: 12,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= lineHeight;
  }

  page.drawText("QR code de contrôle", {
    x: left,
    y: 300,
    size: 13,
    font: boldFont,
    color: rgb(0.12, 0.12, 0.12),
  });

  const qrSize = 180;
  page.drawImage(qrImage, {
    x: left,
    y: 100,
    width: qrSize,
    height: qrSize,
  });

  page.drawText("Présente ce billet à l'entrée de l'événement.", {
    x: left + 210,
    y: 210,
    size: 11,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  page.drawText(`Token: ${ticketEntry.ticket.qrToken}`, {
    x: left + 210,
    y: 185,
    size: 8,
    font,
    color: rgb(0.45, 0.45, 0.45),
    maxWidth: 320,
  });

  const pdfBytes = await pdfDoc.save();

  const pdfArray = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);

  const pdfBuffer = pdfArray.buffer.slice(
    pdfArray.byteOffset,
    pdfArray.byteOffset + pdfArray.byteLength,
  ) as ArrayBuffer;

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="billet-${ticketEntry.ticket.serialNumber}.pdf"`,
    },
  });
}