import { NextResponse } from "next/server";

import { getMembership, getWorkspaceById, WorkspaceMember } from "@/lib/store";

export function requireWorkspaceMembership(
  workspaceId: string,
  userId: string
):
  | { member: WorkspaceMember }
  | NextResponse<{ error: string }> {
  const workspace = getWorkspaceById(workspaceId);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }
  const member = getMembership(workspaceId, userId);
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { member };
}
