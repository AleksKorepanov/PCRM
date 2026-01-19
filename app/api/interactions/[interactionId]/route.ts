import { NextResponse } from "next/server";

import {
  InteractionPrivacyLevel,
  InteractionType,
  canViewInteraction,
  deleteInteraction,
  getInteraction,
  updateInteraction,
} from "@/lib/interactions";
import { requireAuth } from "@/lib/auth";
import { canEditInteractions } from "@/lib/rbac";
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

  return NextResponse.json({ interaction });
}

export async function PUT(
  request: Request,
  context: { params: { interactionId: string } }
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json()) as {
    workspaceId?: string;
    subject?: string;
    summary?: string;
    interactionType?: InteractionType;
    occurredAt?: string;
    privacyLevel?: InteractionPrivacyLevel;
    participants?: { contactId: string; role?: string }[];
    organizations?: string[];
    communities?: string[];
    links?: { url: string; label?: string }[];
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

  const interaction = updateInteraction({
    workspaceId: body.workspaceId,
    interactionId: context.params.interactionId,
    updates: {
      subject: body.subject,
      summary: body.summary,
      interactionType: body.interactionType,
      occurredAt: body.occurredAt,
      privacyLevel: body.privacyLevel,
      participants: body.participants,
      organizations: body.organizations,
      communities: body.communities,
      links: body.links,
    },
  });

  if (!interaction) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ interaction });
}

export async function DELETE(
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

  if (!canEditInteractions(membership.member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deleted = deleteInteraction({
    workspaceId,
    interactionId: context.params.interactionId,
  });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
