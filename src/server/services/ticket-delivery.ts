import nodemailer from "nodemailer";
import { getGuestOrderTickets } from "@/server/queries/guest-tickets";

function buildBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM,
  );
}

export async function sendGuestTicketsEmail(orderId: string, email: string) {
  if (!hasSmtpConfig()) return false;

  const order = await getGuestOrderTickets(orderId, email);
  if (!order) return false;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT!),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  const baseUrl = buildBaseUrl().replace(/\/$/, "");
  const lines: string[] = [];
  for (const item of order.items) {
    for (const ticket of item.tickets) {
      const downloadUrl = `${baseUrl}/api/tickets/download?ticketId=${encodeURIComponent(ticket.id)}&orderId=${encodeURIComponent(order.id)}&email=${encodeURIComponent(order.customerEmail)}`;
      lines.push(
        `- ${item.occurrence.event.title} | ${item.ticketType.name} | ${ticket.serialNumber}`,
      );
      lines.push(`  Télécharger: ${downloadUrl}`);
      lines.push(`  QR token: ${ticket.qrToken}`);
    }
  }

  const htmlList = lines
    .map((line) => `<div style="margin:6px 0;font-family:Arial,sans-serif;">${line}</div>`)
    .join("");

  await transporter.sendMail({
    from: process.env.SMTP_FROM!,
    to: order.customerEmail,
    subject: `Vos billets - commande ${order.id}`,
    text: `Bonjour ${order.customerName ?? ""},\n\nVos billets sont prêts.\n\n${lines.join("\n")}\n\nMerci.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;">
        <h2>Vos billets sont prêts</h2>
        <p>Commande: <strong>${order.id}</strong></p>
        <p>Bonjour ${order.customerName ?? ""}, voici vos billets:</p>
        ${htmlList}
        <p style="margin-top:16px;color:#666;">Ce message est envoyé automatiquement par 3D2Y Events.</p>
      </div>
    `,
  });

  return true;
}
