import { NextResponse } from "next/server";

import {
  buildCsvPreview,
  buildVCardPreview,
  CsvMapping,
  getValidContactsFromCsv,
  parseCsv,
  parseVCard,
} from "@/lib/contacts-import";
import { createContact } from "@/lib/contacts";
import { requireAuth } from "@/lib/auth";
import { canEditContacts } from "@/lib/rbac";
import { requireWorkspaceMembership } from "@/lib/workspaces";

type ImportPayload = {
  workspaceId?: string;
  type?: "csv" | "vcard";
  content?: string;
  mapping?: Record<string, string>;
  action?: "preview" | "import";
};

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json()) as ImportPayload;
  if (!body.workspaceId) {
    return NextResponse.json({ error: "Workspace required" }, { status: 400 });
  }
  if (!body.type || !body.content) {
    return NextResponse.json({ error: "Import payload required" }, { status: 400 });
  }

  const membership = requireWorkspaceMembership(body.workspaceId, auth.userId);
  if (membership instanceof NextResponse) {
    return membership;
  }
  if (!canEditContacts(membership.member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.type === "csv") {
    const parsed = parseCsv(body.content);
    const mapping = (body.mapping ?? {}) as CsvMapping;
    const preview = buildCsvPreview(parsed, mapping);

    if (body.action === "preview") {
      return NextResponse.json({ preview });
    }

    const { contacts, errors } = getValidContactsFromCsv(parsed, mapping);
    const created = contacts.map((draft) =>
      createContact({
        workspaceId: body.workspaceId!,
        name: draft.name ?? "Unnamed contact",
        city: draft.city,
        tier: draft.tier,
        trustScore: draft.trustScore,
        introducedBy: draft.introducedBy,
        aliases: draft.aliases,
        tags: draft.tags,
        organizations: draft.organizations,
        communities: draft.communities,
        channels: draft.channels,
      })
    );
    return NextResponse.json({
      summary: {
        total: preview.summary.total,
        imported: created.length,
        skipped: errors.length,
      },
    });
  }

  if (body.type === "vcard") {
    const drafts = parseVCard(body.content);
    const preview = buildVCardPreview(drafts);
    if (body.action === "preview") {
      return NextResponse.json({ preview });
    }
    const created = preview.rows
      .filter((row) => row.errors.length === 0)
      .map((row) =>
        createContact({
          workspaceId: body.workspaceId!,
          name: row.contact.name ?? "Unnamed contact",
          channels: row.contact.channels,
        })
      );
    return NextResponse.json({
      summary: {
        total: preview.summary.total,
        imported: created.length,
        skipped: preview.summary.invalid,
      },
    });
  }

  return NextResponse.json({ error: "Unsupported import type" }, { status: 400 });
}
