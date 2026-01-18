import { NextResponse } from "next/server";

import { hashPassword, startSession } from "@/lib/auth";
import { createUser, findUserByEmail } from "@/lib/store";

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

  const existing = findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const { hash, salt } = hashPassword(password);
  const user = createUser({ email, passwordHash: hash, passwordSalt: salt });
  startSession(user.id);

  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
