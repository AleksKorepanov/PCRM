import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { findUserById } from "@/lib/store";

export async function GET(): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const user = findUserById(auth.userId);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, locale: user.locale },
  });
}
