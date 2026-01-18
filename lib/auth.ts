import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  createSession,
  deleteSession,
  findUserById,
  getSession,
} from "@/lib/store";

const SESSION_COOKIE = "pcrm_session";

export type PasswordHash = {
  hash: string;
  salt: string;
};

export function hashPassword(password: string): PasswordHash {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64);
  return { hash: derived.toString("hex"), salt };
}

export function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): boolean {
  const derived = scryptSync(password, storedSalt, 64);
  return timingSafeEqual(Buffer.from(storedHash, "hex"), derived);
}

export function setSessionCookie(token: string): void {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(): void {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionFromCookie(): ReturnType<typeof getSession> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) {
    return undefined;
  }
  return getSession(token);
}

export function startSession(userId: string): string {
  const session = createSession(userId);
  setSessionCookie(session.token);
  return session.token;
}

export function endSession(token: string | undefined): void {
  if (token) {
    deleteSession(token);
  }
  clearSessionCookie();
}

export async function requireAuth(): Promise<
  | { userId: string; token: string }
  | NextResponse<{ error: string }>
> {
  const session = getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = findUserById(session.userId);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: user.id, token: session.token };
}
