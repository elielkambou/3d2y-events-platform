import { createHash, randomUUID } from "crypto";

export function generateTicketSerialNumber() {
  return `TKT-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

export function buildTicketQrToken(ticketId: string, serialNumber: string) {
  return `3d2y:${ticketId}:${serialNumber}`;
}

export function hashTicketQrToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function parseTicketQrToken(rawToken: string) {
  const parts = rawToken.trim().split(":");

  if (parts.length !== 3) return null;
  if (parts[0] !== "3d2y") return null;

  const [, ticketId, serialNumber] = parts;

  if (!ticketId || !serialNumber) return null;

  return {
    ticketId,
    serialNumber,
  };
}