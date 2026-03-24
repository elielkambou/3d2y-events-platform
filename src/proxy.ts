import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type SessionRole =
  | "CUSTOMER"
  | "AGENCY"
  | "AGENCY_SCANNER"
  | "SUPPORT_AGENT"
  | "CONTENT_ADMIN"
  | "FINANCE_ADMIN"
  | "SUPER_ADMIN";

type DevSession = {
  userId: string;
  email: string;
  fullName?: string | null;
  roles: SessionRole[];
};

function readSession(request: NextRequest): DevSession | null {
  const raw = request.cookies.get("dev_session")?.value;
  if (!raw) return null;

  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    return JSON.parse(decoded) as DevSession;
  } catch {
    return null;
  }
}

function hasRole(session: DevSession | null, allowed: SessionRole[]) {
  if (!session) return false;
  return session.roles.some((role) => allowed.includes(role));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = readSession(request);

  if (pathname.startsWith("/account") && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    pathname.startsWith("/agency") &&
    !hasRole(session, ["AGENCY", "AGENCY_SCANNER", "SUPER_ADMIN"])
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    pathname.startsWith("/admin") &&
    !hasRole(session, [
      "SUPER_ADMIN",
      "CONTENT_ADMIN",
      "FINANCE_ADMIN",
      "SUPPORT_AGENT",
    ])
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/agency/:path*", "/admin/:path*"],
};