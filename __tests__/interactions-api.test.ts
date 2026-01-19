import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInteraction, resetInteractionsStore } from "@/lib/interactions";
import { resetRelationsStore } from "@/lib/relations";
import { GET as listInteractionsRoute, POST as createInteractionRoute } from "@/app/api/interactions/route";

const requireAuthMock = vi.fn();
const requireWorkspaceMembershipMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  requireAuth: () => requireAuthMock(),
}));

vi.mock("@/lib/workspaces", () => ({
  requireWorkspaceMembership: (...args: unknown[]) =>
    requireWorkspaceMembershipMock(...args),
}));

describe("interactions API RBAC", () => {
  beforeEach(() => {
    resetInteractionsStore();
    resetRelationsStore();
    requireAuthMock.mockReset();
    requireWorkspaceMembershipMock.mockReset();
  });

  it("prevents read-only from creating interactions", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-1", token: "t" });
    requireWorkspaceMembershipMock.mockReturnValue({
      member: { role: "read-only" },
    });

    const request = new Request("http://localhost/api/interactions", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws-1",
        subject: "Intro call",
        interactionType: "call",
        occurredAt: "2024-01-01T10:00:00Z",
      }),
    });

    const response = await createInteractionRoute(request);

    expect(response.status).toBe(403);
  });

  it("filters private interactions for assistants", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-1", token: "t" });
    requireWorkspaceMembershipMock.mockReturnValue({
      member: { role: "assistant" },
    });

    createInteraction({
      workspaceId: "ws-1",
      subject: "Private recap",
      interactionType: "note",
      occurredAt: "2024-01-02T10:00:00Z",
      privacyLevel: "private",
    });

    createInteraction({
      workspaceId: "ws-1",
      subject: "Workspace sync",
      interactionType: "meeting",
      occurredAt: "2024-01-03T10:00:00Z",
      privacyLevel: "workspace",
    });

    const request = new Request("http://localhost/api/interactions?workspaceId=ws-1");
    const response = await listInteractionsRoute(request);
    const payload = (await response.json()) as { interactions: { subject: string }[] };

    expect(payload.interactions).toHaveLength(1);
    expect(payload.interactions[0]?.subject).toBe("Workspace sync");
  });

  it("filters private interactions in search", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-1", token: "t" });
    requireWorkspaceMembershipMock.mockReturnValue({
      member: { role: "assistant" },
    });

    createInteraction({
      workspaceId: "ws-1",
      subject: "Secret handshake",
      interactionType: "message",
      occurredAt: "2024-01-04T10:00:00Z",
      privacyLevel: "private",
    });

    const request = new Request(
      "http://localhost/api/interactions?workspaceId=ws-1&q=secret"
    );
    const response = await listInteractionsRoute(request);
    const payload = (await response.json()) as { interactions: unknown[] };

    expect(payload.interactions).toHaveLength(0);
  });

  it("propagates workspace auth errors", async () => {
    const forbidden = NextResponse.json({ error: "Forbidden" }, { status: 403 });
    requireAuthMock.mockResolvedValue({ userId: "user-1", token: "t" });
    requireWorkspaceMembershipMock.mockReturnValue(forbidden);

    const request = new Request("http://localhost/api/interactions?workspaceId=ws-1");
    const response = await listInteractionsRoute(request);

    expect(response.status).toBe(403);
  });
});
