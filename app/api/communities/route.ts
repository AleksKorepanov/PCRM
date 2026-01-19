import { NextResponse } from "next/server";

import {
  CommunityLinkInput,
  createCommunityWithRole,
  listCommunities,
} from "@/lib/communities";
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

  const communities = listCommunities(workspaceId);
  return NextResponse.json({ communities });
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json()) as {
    workspaceId?: string;
    name?: string;
    description?: string;
    rules?: string[];
    entryRequirements?: string[];
    links?: CommunityLinkInput[];
  };

  if (!body.workspaceId) {
    return NextResponse.json({ error: "Workspace required" }, { status: 400 });
  }

  const membership = requireWorkspaceMembership(body.workspaceId, auth.userId);
  if (membership instanceof NextResponse) {
    return membership;
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Community name required" }, { status: 400 });
  }

  const community = createCommunityWithRole({
    role: membership.member.role,
    workspaceId: body.workspaceId,
    actorUserId: auth.userId,
    name,
    description: body.description,
    rules: body.rules,
    entryRequirements: body.entryRequirements,
    links: body.links,
  });

  if (!community) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ community });
}
