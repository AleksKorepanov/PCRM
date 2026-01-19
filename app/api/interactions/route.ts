import { NextResponse } from "next/server";

import {
  InteractionPrivacyLevel,
  InteractionType,
  createFollowup,
  createInteraction,
  listInteractions,
} from "@/lib/interactions";
import { requireAuth } from "@/lib/auth";
import { canCreateInteractions } from "@/lib/rbac";
import { requireWorkspaceMembership } from "@/lib/workspaces";

function parseNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

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

  const contactId = searchParams.get("contactId") ?? undefined;
  const query = searchParams.get("q") ?? undefined;
  const page = parseNumber(searchParams.get("page")) ?? 1;
  const perPage = parseNumber(searchParams.get("per_page")) ?? 20;

  const result = listInteractions({
    workspaceId,
    role: membership.member.role,
    contactId,
    query,
    page,
    perPage,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request): Promise<NextResponse> {
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
    followup?: {
      assignedToUserId?: string;
      dueAt?: string;
      status?: "open" | "done" | "snoozed";
      notes?: string;
    };
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

  const subject = body.subject?.trim();
  if (!subject) {
    return NextResponse.json(
      { error: "Interaction subject required" },
      { status: 400 }
    );
  }

  if (!body.interactionType) {
    return NextResponse.json(
      { error: "Interaction type required" },
      { status: 400 }
    );
  }

  if (!body.occurredAt) {
    return NextResponse.json(
      { error: "Interaction date required" },
      { status: 400 }
    );
  }

  const interaction = createInteraction({
    workspaceId: body.workspaceId,
    subject,
    summary: body.summary,
    interactionType: body.interactionType,
    occurredAt: body.occurredAt,
    privacyLevel: body.privacyLevel,
    participants: body.participants,
    organizations: body.organizations,
    communities: body.communities,
    links: body.links,
    createdBy: auth.userId,
  });

  const followup = body.followup
    ? createFollowup({
        workspaceId: body.workspaceId,
        interactionId: interaction.id,
        assignedToUserId: body.followup.assignedToUserId,
        dueAt: body.followup.dueAt,
        status: body.followup.status,
        notes: body.followup.notes,
      })
    : undefined;

  return NextResponse.json({
    interaction,
    followup,
  });
}
