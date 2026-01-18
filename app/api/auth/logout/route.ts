import { NextResponse } from "next/server";

import { endSession, getSessionFromCookie } from "@/lib/auth";

export async function POST(): Promise<NextResponse> {
  const session = getSessionFromCookie();
  endSession(session?.token);
  return NextResponse.json({ status: "ok" });
}
