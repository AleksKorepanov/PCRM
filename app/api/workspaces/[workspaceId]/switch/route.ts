import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { updateSessionActiveWorkspace } from "@/lib/store";
import { requireWorkspaceMembership } from "@/lib/workspaces";

export async function POST(
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

  updateSessionActiveWorkspace(auth.token, context.params.workspaceId);
  return NextResponse.json({ status: "ok" });
}
