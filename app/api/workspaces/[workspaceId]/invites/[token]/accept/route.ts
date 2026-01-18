import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import {
  acceptInvite,
  addAuditLog,
  addMember,
  findInviteByToken,
  findUserById,
  getMembership,
} from "@/lib/store";
import { requireWorkspaceMembership } from "@/lib/workspaces";

export async function POST(
  _request: Request,
  context: { params: { workspaceId: string; token: string } }
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const invite = findInviteByToken(
    context.params.workspaceId,
    context.params.token
  );
  if (!invite || invite.acceptedAt) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  const user = findUserById(auth.userId);
  if (!user || user.email !== invite.email) {
    return NextResponse.json({ error: "Invite email mismatch" }, { status: 403 });
  }

  const existingMember = getMembership(invite.workspaceId, user.id);
  if (!existingMember) {
    addMember({
      workspaceId: invite.workspaceId,
      userId: user.id,
      role: invite.role,
    });
  }
  acceptInvite(invite.id);

  const membershipCheck = requireWorkspaceMembership(invite.workspaceId, user.id);
  if (membershipCheck instanceof NextResponse) {
    return membershipCheck;
  }

  addAuditLog({
    workspaceId: invite.workspaceId,
    actorUserId: user.id,
    action: "member.accepted",
    metadata: { inviteId: invite.id, role: invite.role },
  });

  return NextResponse.json({ status: "accepted" });
}
