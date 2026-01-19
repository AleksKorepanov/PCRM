import { NextResponse } from "next/server";

import {
  canViewInteraction,
  createFollowup,
  getInteraction,
  listFollowupsForInteraction,
} from "@/lib/interactions";
import { requireAuth } from "@/lib/auth";
import { canCreateInteractions } from "@/lib/rbac";
import { requireWorkspaceMembership } from "@/lib/workspaces";

export async function GET(
  request: Request,
  context: { params: { interactionId: string } }
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

  const interaction = getInteraction({
    workspaceId,
    interactionId: context.params.interactionId,
  });
  if (!interaction) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canViewInteraction(membership.member.role, interaction)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const followups = listFollowupsForInteraction({
    workspaceId,
    interactionId: context.params.interactionId,
  });

  return NextResponse.json({ followups });
}

export async function POST(
  request: Request,
  context: { params: { interactionId: string } }
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

  if (!canCreateInteractions(membership.member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const interaction = getInteraction({
    workspaceId: body.workspaceId,
    interactionId: context.params.interactionId,
  });
  if (!interaction) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canViewInteraction(membership.member.role, interaction)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const followup = createFollowup({
    workspaceId: body.workspaceId,
    interactionId: context.params.interactionId,
    assignedToUserId: body.assignedToUserId,
    dueAt: body.dueAt,
    status: body.status,
    notes: body.notes,
  });

  if (!followup) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ followup });
}
