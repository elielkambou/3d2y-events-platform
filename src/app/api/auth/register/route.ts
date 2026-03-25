import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { hashPassword } from "@/lib/auth/password";
import {
  AUTH_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  createDatabaseSession,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };

  const fullName = body.fullName?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const confirmPassword = body.confirmPassword ?? "";

  if (!fullName || !email || !password || !confirmPassword) {
    return NextResponse.json(
      { error: "Tous les champs sont requis." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères." },
      { status: 400 },
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Les mots de passe ne correspondent pas." },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash,
      isActive: true,
      isEmailVerified: false,
      roles: {
        create: [
          {
            role: "CUSTOMER",
          },
        ],
      },
    },
    include: {
      roles: true,
    },
  });

  const { rawToken, expiresAt } = await createDatabaseSession(user.id, 7);

  const response = NextResponse.json({
    ok: true,
    redirectTo: "/account",
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