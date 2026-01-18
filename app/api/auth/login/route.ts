import { NextResponse } from "next/server";

import { startSession, verifyPassword } from "@/lib/auth";
import { findUserByEmail } from "@/lib/store";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  startSession(user.id);

  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
