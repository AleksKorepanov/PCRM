import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { canViewAudit } from "@/lib/rbac";
import { listAuditLogs } from "@/lib/store";
import { requireWorkspaceMembership } from "@/lib/workspaces";

export async function GET(
  _request: Request,
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

  if (!canViewAudit(membership.member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = listAuditLogs(context.params.workspaceId);
  return NextResponse.json({ logs });
}
