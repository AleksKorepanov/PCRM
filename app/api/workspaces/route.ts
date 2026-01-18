import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { addAuditLog, addMember, createWorkspace, listWorkspacesForUser } from "@/lib/store";

export async function GET(): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const workspaces = listWorkspacesForUser(auth.userId);
  return NextResponse.json({ workspaces });
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Workspace name required" }, { status: 400 });
  }

  const workspace = createWorkspace({ name, createdBy: auth.userId });
  addMember({ workspaceId: workspace.id, userId: auth.userId, role: "owner" });
  addAuditLog({
    workspaceId: workspace.id,
    actorUserId: auth.userId,
    action: "workspace.created",
    metadata: { name },
  });

  return NextResponse.json({ workspace });
}
