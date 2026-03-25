import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AUTH_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  deleteDatabaseSession,
} from "@/lib/auth/session";

export async function POST() {
  const cookieStore = await cookies();

  const authRaw = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

  if (authRaw) {
    await deleteDatabaseSession(authRaw);
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 0,
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