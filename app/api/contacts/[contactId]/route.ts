import { NextResponse } from "next/server";

import {
  ContactChannel,
  ContactNote,
  ContactVisibility,
  deleteContact,
  filterNotesForRole,
  getContact,
  updateContact,
} from "@/lib/contacts";
import { requireAuth } from "@/lib/auth";
import { canEditContacts } from "@/lib/rbac";
import { requireWorkspaceMembership } from "@/lib/workspaces";

export async function GET(
  request: Request,
  context: { params: { contactId: string } }
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

  const contact = getContact({ workspaceId, contactId: context.params.contactId });
  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    contact: filterNotesForRole(contact, membership.member.role),
  });
}

export async function PUT(
  request: Request,
  context: { params: { contactId: string } }
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json()) as {
    workspaceId?: string;
    name?: string;
    city?: string;
    tier?: string;
    trustScore?: number;
    introducedBy?: string;
    aliases?: string[];
    tags?: string[];
    organizations?: string[];
    communities?: string[];
    channels?: ContactChannel[];
    fieldVisibility?: Record<string, ContactVisibility>;
    notes?: ContactNote[];
    lastInteractionAt?: string;
  };

  if (!body.workspaceId) {
    return NextResponse.json({ error: "Workspace required" }, { status: 400 });
  }

  const membership = requireWorkspaceMembership(body.workspaceId, auth.userId);
  if (membership instanceof NextResponse) {
    return membership;
  }

  if (!canEditContacts(membership.member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contact = updateContact({
    contactId: context.params.contactId,
    workspaceId: body.workspaceId,
    updates: {
      name: body.name,
      city: body.city,
      tier: body.tier,
      trustScore: body.trustScore,
      introducedBy: body.introducedBy,
      aliases: body.aliases,
      tags: body.tags,
      organizations: body.organizations,
      communities: body.communities,
      channels: body.channels,
      fieldVisibility: body.fieldVisibility,
      notes: body.notes,
      lastInteractionAt: body.lastInteractionAt,
    },
  });

  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    contact: filterNotesForRole(contact, membership.member.role),
  });
}

export async function DELETE(
  request: Request,
  context: { params: { contactId: string } }
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

  if (!canEditContacts(membership.member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deleted = deleteContact({
    contactId: context.params.contactId,
    workspaceId,
  });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
