import { NextResponse } from "next/server";

import { ContactMergeSelection, mergeContacts } from "@/lib/contacts";
import { requireAuth } from "@/lib/auth";
import { canEditContacts } from "@/lib/rbac";
import { requireWorkspaceMembership } from "@/lib/workspaces";

type MergePayload = {
  workspaceId?: string;
  survivorId?: string;
  sourceIds?: string[];
  selections?: ContactMergeSelection;
};

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json()) as MergePayload;
  if (!body.workspaceId || !body.survivorId || !body.sourceIds) {
    return NextResponse.json({ error: "Merge payload required" }, { status: 400 });
  }

  const membership = requireWorkspaceMembership(body.workspaceId, auth.userId);
  if (membership instanceof NextResponse) {
    return membership;
  }

  if (!canEditContacts(membership.member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const merged = mergeContacts({
    workspaceId: body.workspaceId,
    survivorId: body.survivorId,
    sourceIds: body.sourceIds,
    selections: body.selections,
  });

  if (!merged) {
    return NextResponse.json({ error: "Unable to merge contacts" }, { status: 400 });
  }

  return NextResponse.json({ contact: merged });
}
