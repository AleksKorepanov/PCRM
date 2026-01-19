import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import {
  getIntroductionTemplates,
  updateIntroductionTemplates,
} from "@/lib/introductions";
import { canCoordinateIntroductions } from "@/lib/rbac";
import { requireWorkspaceMembership } from "@/lib/workspaces";

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json()) as {
    workspaceId?: string;
    templates?: {
      ru?: {
        requestSubject?: string;
        requestBody?: string;
        consentBody?: string;
        outcomeBody?: string;
      };
      en?: {
        requestSubject?: string;
        requestBody?: string;
        consentBody?: string;
        outcomeBody?: string;
      };
    };
  };

  if (!body.workspaceId) {
    return NextResponse.json({ error: "Workspace required" }, { status: 400 });
  }

  const membership = requireWorkspaceMembership(body.workspaceId, auth.userId);
  if (membership instanceof NextResponse) {
    return membership;
  }

  if (!canCoordinateIntroductions(membership.member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const current = getIntroductionTemplates(body.workspaceId);
  const templates = {
    ru: {
      requestSubject: body.templates?.ru?.requestSubject ?? current.ru.requestSubject,
      requestBody: body.templates?.ru?.requestBody ?? current.ru.requestBody,
      consentBody: body.templates?.ru?.consentBody ?? current.ru.consentBody,
      outcomeBody: body.templates?.ru?.outcomeBody ?? current.ru.outcomeBody,
    },
    en: {
      requestSubject: body.templates?.en?.requestSubject ?? current.en.requestSubject,
      requestBody: body.templates?.en?.requestBody ?? current.en.requestBody,
      consentBody: body.templates?.en?.consentBody ?? current.en.consentBody,
      outcomeBody: body.templates?.en?.outcomeBody ?? current.en.outcomeBody,
    },
  };

  const updated = updateIntroductionTemplates({
    workspaceId: body.workspaceId,
    templates,
  });

  return NextResponse.json({ templates: updated });
}
