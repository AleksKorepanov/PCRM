import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { getDigestTemplates, updateDigestTemplates } from "@/lib/needs-offers";
import { canManageNeedsOffers } from "@/lib/rbac";
import { requireWorkspaceMembership } from "@/lib/workspaces";

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json()) as {
    workspaceId?: string;
    templates?: {
      ru?: { header?: string; footer?: string };
      en?: { header?: string; footer?: string };
    };
  };

  if (!body.workspaceId) {
    return NextResponse.json({ error: "Workspace required" }, { status: 400 });
  }

  const membership = requireWorkspaceMembership(body.workspaceId, auth.userId);
  if (membership instanceof NextResponse) {
    return membership;
  }

  if (!canManageNeedsOffers(membership.member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const current = getDigestTemplates(body.workspaceId);
  const templates = {
    ru: {
      header: body.templates?.ru?.header ?? current.ru.header,
      footer: body.templates?.ru?.footer ?? current.ru.footer,
    },
    en: {
      header: body.templates?.en?.header ?? current.en.header,
      footer: body.templates?.en?.footer ?? current.en.footer,
    },
  };

  const updated = updateDigestTemplates({ workspaceId: body.workspaceId, templates });

  return NextResponse.json({ templates: updated });
}
