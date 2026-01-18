import { NextResponse } from "next/server";

import { suggestDuplicates } from "@/lib/contacts-dedupe";
import { listAllContacts } from "@/lib/contacts";
import { requireAuth } from "@/lib/auth";
import { requireWorkspaceMembership } from "@/lib/workspaces";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace required" }, { status: 400 });
  }

  const membership = requireWorkspaceMembership(workspaceId, auth.userId);
  if (membership instanceof NextResponse) {
    return membership;
  }

  const contacts = listAllContacts(workspaceId);
  const suggestions = suggestDuplicates(contacts);
  return NextResponse.json({ suggestions });
}
