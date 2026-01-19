import { beforeEach, describe, expect, it } from "vitest";

import {
  createCommunity,
  createCommunityMembership,
  createCommunityWithRole,
  deleteCommunity,
  listCommunityMemberships,
  resetCommunitiesStore,
  updateCommunity,
  updateCommunityWithRole,
} from "@/lib/communities";
import { createContact, getContact, resetContactsStore } from "@/lib/contacts";

const workspaceId = "ws-communities";

describe("communities", () => {
  beforeEach(() => {
    resetCommunitiesStore();
    resetContactsStore();
  });

  it("syncs contact community tags when memberships change", () => {
    const contact = createContact({
      workspaceId,
      name: "Alex",
      tags: [],
      organizations: [],
      communities: [],
      channels: [],
      notes: [],
    });

    const community = createCommunity({
      workspaceId,
      name: "Founders Guild",
      rules: ["Give before you get"],
    });

    const membership = createCommunityMembership({
      workspaceId,
      communityId: community.id,
      contactId: contact.id,
      role: "member",
      joinedAt: "2024-01-10",
    });

    expect(membership).toBeTruthy();
    expect(getContact({ workspaceId, contactId: contact.id })?.communities).toContain(
      community.name
    );

    updateCommunity({
      workspaceId,
      communityId: community.id,
      updates: { name: "Founders Guild Plus" },
    });

    const updatedContact = getContact({ workspaceId, contactId: contact.id });
    expect(updatedContact?.communities).toContain("Founders Guild Plus");
    expect(updatedContact?.communities).not.toContain("Founders Guild");

    deleteCommunity({ workspaceId, communityId: community.id });

    const finalContact = getContact({ workspaceId, contactId: contact.id });
    expect(finalContact?.communities ?? []).toHaveLength(0);
    expect(listCommunityMemberships({ workspaceId })).toHaveLength(0);
  });

  it("enforces role checks for community edits", () => {
    const forbidden = createCommunityWithRole({
      role: "read-only",
      workspaceId,
      actorUserId: "user-1",
      name: "Hidden",
    });

    expect(forbidden).toBeUndefined();

    const allowed = createCommunityWithRole({
      role: "member",
      workspaceId,
      actorUserId: "user-2",
      name: "Open Guild",
    });

    expect(allowed).toBeTruthy();

    const updateDenied = updateCommunityWithRole({
      role: "read-only",
      workspaceId,
      actorUserId: "user-2",
      communityId: allowed!.id,
      updates: { description: "Updated" },
    });

    expect(updateDenied).toBeUndefined();

    const updateAllowed = updateCommunityWithRole({
      role: "assistant",
      workspaceId,
      actorUserId: "user-2",
      communityId: allowed!.id,
      updates: { description: "Updated" },
    });

    expect(updateAllowed?.description).toBe("Updated");
  });
});
