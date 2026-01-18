import { NextResponse } from "next/server";

import {
  ContactChannel,
  ContactFilters,
  ContactNote,
  ContactVisibility,
  createContact,
  filterNotesForRole,
  listContacts,
} from "@/lib/contacts";
import { requireAuth } from "@/lib/auth";
import { canEditContacts } from "@/lib/rbac";
import { requireWorkspaceMembership } from "@/lib/workspaces";

function parseNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseFilters(searchParams: URLSearchParams): ContactFilters {
  const tags = searchParams.get("tags")?.split(",").map((tag) => tag.trim());
  return {
    tier: searchParams.get("tier") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    tags: tags?.filter(Boolean),
    trustScoreMin: parseNumber(searchParams.get("trust_score_min")),
    trustScoreMax: parseNumber(searchParams.get("trust_score_max")),
    organization: searchParams.get("organization") ?? undefined,
    community: searchParams.get("community") ?? undefined,
  };
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

  const filters = parseFilters(searchParams);
  const sort = searchParams.get("sort") as
    | "last_interaction"
    | "trust_score"
    | "name"
    | null;
  const page = parseNumber(searchParams.get("page")) ?? 1;
  const perPage = parseNumber(searchParams.get("per_page")) ?? 20;

  const result = listContacts({
    workspaceId,
    filters,
    sort: sort ?? undefined,
    page,
    perPage,
  });

  const contacts = result.contacts.map((contact) =>
    filterNotesForRole(contact, membership.member.role)
  );

  return NextResponse.json({ ...result, contacts });
}

export async function POST(request: Request): Promise<NextResponse> {
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

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Contact name required" }, { status: 400 });
  }

  const contact = createContact({
    workspaceId: body.workspaceId,
    name,
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
  });

  return NextResponse.json({
    contact: filterNotesForRole(contact, membership.member.role),
  });
}
