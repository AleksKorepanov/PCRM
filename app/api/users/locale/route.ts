import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { findUserById, updateUserLocale } from "@/lib/store";

const allowedLocales = ["ru", "en"] as const;

type AllowedLocale = (typeof allowedLocales)[number];

export async function GET(): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const user = findUserById(auth.userId);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ locale: user.locale });
}

export async function PUT(request: Request): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json()) as { locale?: string };
  const locale = body.locale?.toLowerCase();

  if (!locale || !allowedLocales.includes(locale as AllowedLocale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const updated = updateUserLocale(auth.userId, locale as AllowedLocale);
  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ locale: updated.locale });
}
