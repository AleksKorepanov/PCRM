import { NextResponse } from "next/server";

import {
  CommunityLinkInput,
  deleteCommunityWithRole,
  getCommunity,
  updateCommunityWithRole,
} from "@/lib/communities";
import { requireAuth } from "@/lib/auth";
import { requireWorkspaceMembership } from "@/lib/workspaces";

export async function GET(
  request: Request,
  context: { params: { communityId: string } }
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

  const community = getCommunity({
    workspaceId,
    communityId: context.params.communityId,
  });

  if (!community) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ community });
}

export async function PATCH(
  request: Request,
  context: { params: { communityId: string } }
): Promise<NextResponse> {
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

  const community = updateCommunityWithRole({
    role: membership.member.role,
    workspaceId: body.workspaceId,
    actorUserId: auth.userId,
    communityId: context.params.communityId,
    updates: {
      name: body.name,
      description: body.description,
      rules: body.rules,
      entryRequirements: body.entryRequirements,
      links: body.links,
    },
  });

  if (!community) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ community });
}

export async function DELETE(
  request: Request,
  context: { params: { communityId: string } }
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

  const deleted = deleteCommunityWithRole({
    role: membership.member.role,
    workspaceId,
    actorUserId: auth.userId,
    communityId: context.params.communityId,
  });

  if (!deleted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ deleted: true });
}
