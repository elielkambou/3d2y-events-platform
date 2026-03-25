import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import {
  AUTH_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  createDatabaseSession,
} from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

function getRedirectPath(roles: string[]) {
  if (
    roles.includes("SUPER_ADMIN") ||
    roles.includes("CONTENT_ADMIN") ||
    roles.includes("FINANCE_ADMIN") ||
    roles.includes("SUPPORT_AGENT")
  ) {
    return "/admin";
  }

  if (roles.includes("AGENCY") || roles.includes("AGENCY_SCANNER")) {
    return "/agency";
  }

  return "/account";
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email et mot de passe requis." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: true,
    },
  });

  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: "Identifiants invalides." },
      { status: 401 },
    );
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return NextResponse.json(
      { error: "Identifiants invalides." },
      { status: 401 },
    );
  }

  const { rawToken, expiresAt } = await createDatabaseSession(user.id, 7);

  const response = NextResponse.json({
    ok: true,
    redirectTo: getRedirectPath(user.roles.map((role) => role.role)),
  });

  response.cookies.set(AUTH_SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    expires: expiresAt,
  });

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 0,
  });

  return response;
}