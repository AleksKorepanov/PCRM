import { NextResponse } from "next/server";

import { deleteFollowup, updateFollowup } from "@/lib/interactions";
import { requireAuth } from "@/lib/auth";
import { canEditInteractions } from "@/lib/rbac";
import { requireWorkspaceMembership } from "@/lib/workspaces";

export async function PUT(
  request: Request,
  context: { params: { followupId: string } }
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json()) as {
    workspaceId?: string;
    assignedToUserId?: string;
    dueAt?: string;
    status?: "open" | "done" | "snoozed";
    notes?: string;
  };

  if (!body.workspaceId) {
    return NextResponse.json({ error: "Workspace required" }, { status: 400 });
  }

  const membership = requireWorkspaceMembership(body.workspaceId, auth.userId);
  if (membership instanceof NextResponse) {
    return membership;
  }

  if (!canEditInteractions(membership.member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const followup = updateFollowup({
    workspaceId: body.workspaceId,
    followupId: context.params.followupId,
    updates: {
      assignedToUserId: body.assignedToUserId,
      dueAt: body.dueAt,
      status: body.status,
      notes: body.notes,
    },
  });

  if (!followup) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ followup });
}

export async function DELETE(
  request: Request,
  context: { params: { followupId: string } }
): Promise<NextResponse> {
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

  if (!canEditInteractions(membership.member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deleted = deleteFollowup({
    workspaceId,
    followupId: context.params.followupId,
  });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
