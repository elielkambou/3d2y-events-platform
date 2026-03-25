import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma/client";

export type SessionRole =
  | "CUSTOMER"
  | "AGENCY"
  | "AGENCY_SCANNER"
  | "SUPPORT_AGENT"
  | "CONTENT_ADMIN"
  | "FINANCE_ADMIN"
  | "SUPER_ADMIN";

export type DevSession = {
  userId: string;
  email: string;
  fullName?: string | null;
  roles: SessionRole[];
};

export const SESSION_COOKIE_NAME = "dev_session";
export const AUTH_SESSION_COOKIE_NAME = "auth_session";

export function encodeSession(session: DevSession) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function generateRawSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function createDatabaseSession(userId: string, durationDays = 7) {
  const rawToken = generateRawSessionToken();
  const tokenHash = hashSessionToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  await prisma.authSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    rawToken,
    expiresAt,
  };
}

export async function deleteDatabaseSession(rawToken: string) {
  const tokenHash = hashSessionToken(rawToken);

  await prisma.authSession.deleteMany({
    where: {
      tokenHash,
    },
  });
}

export async function getSession(): Promise<DevSession | null> {
  const cookieStore = await cookies();

  const authRaw = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

  if (authRaw) {
    const tokenHash = hashSessionToken(authRaw);

    const authSession = await prisma.authSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (
      authSession &&
      authSession.expiresAt > new Date() &&
      authSession.user.isActive
    ) {
      return {
        userId: authSession.user.id,
        email: authSession.user.email,
        fullName: authSession.user.fullName,
        roles: authSession.user.roles.map((role) => role.role),
      };
    }
  }

  const rawDevSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawDevSession) return null;

  try {
    const decoded = Buffer.from(rawDevSession, "base64url").toString("utf8");
    return JSON.parse(decoded) as DevSession;
  } catch {
    return null;
  }
}