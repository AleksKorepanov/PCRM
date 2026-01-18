import { NextResponse } from "next/server";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { createContact, resetContactsStore } from "@/lib/contacts";
import { GET as listContactsRoute, POST as createContactRoute } from "@/app/api/contacts/route";
import {
  DELETE as deleteContactRoute,
  GET as getContactRoute,
  PUT as updateContactRoute,
} from "@/app/api/contacts/[contactId]/route";

const requireAuthMock = vi.fn();
const requireWorkspaceMembershipMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  requireAuth: () => requireAuthMock(),
}));

vi.mock("@/lib/workspaces", () => ({
  requireWorkspaceMembership: (...args: unknown[]) =>
    requireWorkspaceMembershipMock(...args),
}));

describe("contacts API RBAC", () => {
  beforeEach(() => {
    resetContactsStore();
    requireAuthMock.mockReset();
    requireWorkspaceMembershipMock.mockReset();
  });

  it("prevents read-only from creating contacts", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-1", token: "t" });
    requireWorkspaceMembershipMock.mockReturnValue({
      member: { role: "read-only" },
    });

    const request = new Request("http://localhost/api/contacts", {
      method: "POST",
      body: JSON.stringify({ workspaceId: "ws-1", name: "Test" }),
    });

    const response = await createContactRoute(request);

    expect(response.status).toBe(403);
  });

  it("filters private notes for assistants", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-1", token: "t" });
    requireWorkspaceMembershipMock.mockReturnValue({
      member: { role: "assistant" },
    });

    const contact = createContact({
      workspaceId: "ws-1",
      name: "Test",
      notes: [
        { id: "note-1", content: "Private", visibility: "private", createdAt: "2024-01-01" },
        { id: "note-2", content: "Public", visibility: "public", createdAt: "2024-01-01" },
      ],
    });

    const request = new Request(
      `http://localhost/api/contacts/${contact.id}?workspaceId=ws-1`
    );

    const response = await getContactRoute(request, {
      params: { contactId: contact.id },
    });
    const payload = (await response.json()) as { contact: { notes: { id: string }[] } };

    expect(payload.contact.notes).toHaveLength(1);
    expect(payload.contact.notes[0]?.id).toBe("note-2");
  });

  it("prevents read-only updates and deletes", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-1", token: "t" });
    requireWorkspaceMembershipMock.mockReturnValue({
      member: { role: "read-only" },
    });

    const contact = createContact({
      workspaceId: "ws-1",
      name: "Test",
    });

    const updateRequest = new Request(
      `http://localhost/api/contacts/${contact.id}`,
      {
        method: "PUT",
        body: JSON.stringify({ workspaceId: "ws-1", name: "Updated" }),
      }
    );

    const updateResponse = await updateContactRoute(updateRequest, {
      params: { contactId: contact.id },
    });

    expect(updateResponse.status).toBe(403);

    const deleteRequest = new Request(
      `http://localhost/api/contacts/${contact.id}?workspaceId=ws-1`,
      {
        method: "DELETE",
      }
    );

    const deleteResponse = await deleteContactRoute(deleteRequest, {
      params: { contactId: contact.id },
    });

    expect(deleteResponse.status).toBe(403);
  });

  it("returns filtered list for assistants", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-1", token: "t" });
    requireWorkspaceMembershipMock.mockReturnValue({
      member: { role: "assistant" },
    });

    createContact({
      workspaceId: "ws-1",
      name: "Test",
      notes: [
        { id: "note-1", content: "Private", visibility: "private", createdAt: "2024-01-01" },
      ],
    });

    const request = new Request("http://localhost/api/contacts?workspaceId=ws-1");
    const response = await listContactsRoute(request);
    const payload = (await response.json()) as { contacts: { notes: { id: string }[] }[] };

    expect(payload.contacts[0]?.notes).toHaveLength(0);
  });

  it("propagates workspace auth errors", async () => {
    const forbidden = NextResponse.json({ error: "Forbidden" }, { status: 403 });
    requireAuthMock.mockResolvedValue({ userId: "user-1", token: "t" });
    requireWorkspaceMembershipMock.mockReturnValue(forbidden);

    const request = new Request("http://localhost/api/contacts?workspaceId=ws-1");
    const response = await listContactsRoute(request);

    expect(response.status).toBe(403);
  });
});
