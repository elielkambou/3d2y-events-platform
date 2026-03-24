import type { DevSession, SessionRole } from "@/lib/auth/session";

export function hasRole(
  session: DevSession | null,
  allowed: SessionRole[],
): boolean {
  if (!session) return false;
  return session.roles.some((role) => allowed.includes(role));
}

export function canAccessCustomer(session: DevSession | null) {
  return !!session;
}

export function canAccessAgency(session: DevSession | null) {
  return hasRole(session, ["AGENCY", "AGENCY_SCANNER", "SUPER_ADMIN"]);
}

export function canManageAgency(session: DevSession | null) {
  return hasRole(session, ["AGENCY", "SUPER_ADMIN"]);
}

export function canAccessAdmin(session: DevSession | null) {
  return hasRole(session, [
    "SUPER_ADMIN",
    "CONTENT_ADMIN",
    "FINANCE_ADMIN",
    "SUPPORT_AGENT",
  ]);
}

export function canAccessScanner(session: DevSession | null) {
  return hasRole(session, ["AGENCY", "AGENCY_SCANNER", "SUPER_ADMIN"]);
}