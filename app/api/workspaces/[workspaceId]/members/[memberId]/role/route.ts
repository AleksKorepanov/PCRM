import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { canChangeRoles, isValidRole } from "@/lib/rbac";
import {
  addAuditLog,
  listMembersForWorkspace,
  updateMemberRole,
} from "@/lib/store";
import { requireWorkspaceMembership } from "@/lib/workspaces";

export async function PATCH(
  request: Request,
  context: { params: { workspaceId: string; memberId: string } }
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

  if (!canChangeRoles(membership.member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { role?: string };
  if (!body.role || !isValidRole(body.role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const members = listMembersForWorkspace(context.params.workspaceId);
  const target = members.find((member) => member.id === context.params.memberId);
  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (target.role === "owner" && body.role !== "owner") {
    const ownerCount = members.filter((member) => member.role === "owner").length;
    if (ownerCount <= 1) {
      return NextResponse.json({ error: "At least one owner required" }, { status: 400 });
    }
  }

  const updated = updateMemberRole(target.id, body.role);
  if (!updated) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  addAuditLog({
    workspaceId: context.params.workspaceId,
    actorUserId: auth.userId,
    action: "member.role_changed",
    metadata: { memberId: target.id, role: body.role },
  });

  return NextResponse.json({ member: updated });
}
