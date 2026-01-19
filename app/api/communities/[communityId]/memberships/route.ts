import { NextResponse } from "next/server";

import {
  createCommunityMembershipWithRole,
  listCommunityMemberships,
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

  const memberships = listCommunityMemberships({
    workspaceId,
    communityId: context.params.communityId,
  });

  return NextResponse.json({ memberships });
}

export async function POST(
  request: Request,
  context: { params: { communityId: string } }
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json()) as {
    workspaceId?: string;
    contactId?: string;
    role?: string;
    joinedAt?: string;
    leftAt?: string;
  };

  if (!body.workspaceId) {
    return NextResponse.json({ error: "Workspace required" }, { status: 400 });
  }

  if (!body.contactId) {
    return NextResponse.json({ error: "Contact required" }, { status: 400 });
  }

  const membership = requireWorkspaceMembership(body.workspaceId, auth.userId);
  if (membership instanceof NextResponse) {
    return membership;
  }

  const created = createCommunityMembershipWithRole({
    role: membership.member.role,
    workspaceId: body.workspaceId,
    actorUserId: auth.userId,
    communityId: context.params.communityId,
    contactId: body.contactId,
    roleName: body.role,
    joinedAt: body.joinedAt,
    leftAt: body.leftAt,
  });

  if (!created) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ membership: created });
}
