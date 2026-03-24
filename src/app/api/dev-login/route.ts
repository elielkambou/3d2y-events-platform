import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { encodeSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";

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

  return response;
}