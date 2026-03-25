import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import {
  AUTH_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  deleteDatabaseSession,
  encodeSession,
} from "@/lib/auth/session";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };

  if (!body.email) {
    return NextResponse.json(
      { error: "Email requis." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: body.email },
    include: {
      roles: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Utilisateur introuvable." },
      { status: 404 },
    );
  }

  const cookieStore = await cookies();
  const authRaw = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

  if (authRaw) {
    await deleteDatabaseSession(authRaw);
  }

  const sessionValue = encodeSession({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles.map((r) => r.role),
  });

  const response = NextResponse.json({ ok: true });

  response.cookies.set(SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  response.cookies.set(AUTH_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 0,
  });

  return response;
}