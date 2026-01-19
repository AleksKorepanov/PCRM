import { NextResponse } from "next/server";

import {
  removeCommunityMembershipWithRole,
  updateCommunityMembershipWithRole,
} from "@/lib/communities";
import { requireAuth } from "@/lib/auth";
import { requireWorkspaceMembership } from "@/lib/workspaces";

export async function PATCH(
  request: Request,
  context: { params: { communityId: string; membershipId: string } }
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json()) as {
    workspaceId?: string;
    role?: string;
    joinedAt?: string;
    leftAt?: string;
  };

  if (!body.workspaceId) {
    return NextResponse.json({ error: "Workspace required" }, { status: 400 });
  }

  const membership = requireWorkspaceMembership(body.workspaceId, auth.userId);
  if (membership instanceof NextResponse) {
    return membership;
  }

  const updated = updateCommunityMembershipWithRole({
    role: membership.member.role,
    workspaceId: body.workspaceId,
    actorUserId: auth.userId,
    membershipId: context.params.membershipId,
    updates: {
      role: body.role,
      joinedAt: body.joinedAt,
      leftAt: body.leftAt,
    },
  });

  if (!updated) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ membership: updated });
}

export async function DELETE(
  request: Request,
  context: { params: { communityId: string; membershipId: string } }
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

  const removed = removeCommunityMembershipWithRole({
    role: membership.member.role,
    workspaceId,
    actorUserId: auth.userId,
    membershipId: context.params.membershipId,
  });

  if (!removed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ removed: true });
}
