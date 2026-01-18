import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { canInviteMembers, isValidRole } from "@/lib/rbac";
import { addAuditLog, createInvite } from "@/lib/store";
import { requireWorkspaceMembership } from "@/lib/workspaces";

export async function POST(
  request: Request,
  context: { params: { workspaceId: string } }
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const membership = requireWorkspaceMembership(
    context.params.workspaceId,
    auth.userId
  );
  if (membership instanceof NextResponse) {
    return membership;
  }

  if (!canInviteMembers(membership.member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    email?: string;
    role?: string;
  };
  const email = body.email?.trim().toLowerCase();
  const role = body.role;
  if (!email || !role || !isValidRole(role)) {
    return NextResponse.json({ error: "Invalid invite details" }, { status: 400 });
  }

  const token = randomBytes(24).toString("hex");
  const invite = createInvite({
    workspaceId: context.params.workspaceId,
    email,
    role,
    invitedBy: auth.userId,
    token,
  });

  addAuditLog({
    workspaceId: context.params.workspaceId,
    actorUserId: auth.userId,
    action: "member.invited",
    metadata: { email, role, inviteId: invite.id },
  });

  return NextResponse.json({ invite: { id: invite.id, token } });
}
