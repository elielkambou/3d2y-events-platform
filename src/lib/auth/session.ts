import { cookies } from "next/headers";

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

const COOKIE_NAME = "dev_session";

export async function getSession(): Promise<DevSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;

  if (!raw) return null;

  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    return JSON.parse(decoded) as DevSession;
  } catch {
    return null;
  }
}

export function encodeSession(session: DevSession) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;