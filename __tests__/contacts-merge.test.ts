import { describe, expect, it, beforeEach } from "vitest";

import {
  createContact,
  listAllContacts,
  mergeContacts,
  resetContactsStore,
} from "@/lib/contacts";
import {
  createCommitment,
  listCommitmentsForContact,
  resetCommitmentsStore,
} from "@/lib/commitments";
import {
  createCommunityMembership,
  createInteractionParticipant,
  createNeedOffer,
  createRelationshipEdge,
  listRelations,
  resetRelationsStore,
} from "@/lib/relations";

describe("contacts merge", () => {
  beforeEach(() => {
    resetContactsStore();
    resetRelationsStore();
    resetCommitmentsStore();
  });

  it("merges contacts and reassigns relations", () => {
    const workspaceId = "ws-merge";
    const survivor = createContact({
      workspaceId,
      name: "Alpha",
      tags: ["core"],
      channels: [{ id: "email-1", type: "email", value: "alpha@example.com", isPrimary: true }],
    });
    const source = createContact({
      workspaceId,
      name: "Alfa",
      tags: ["vip"],
      aliases: ["Альфа"],
      channels: [{ id: "phone-1", type: "phone", value: "+7 999 000 11 22", isPrimary: true }],
    });

    createCommunityMembership({
      workspaceId,
      communityId: "community-1",
      contactId: source.id,
    });
    createInteractionParticipant({
      workspaceId,
      interactionId: "interaction-1",
      contactId: source.id,
    });
    createCommitment({
      workspaceId,
      title: "Deliver roadmap",
      status: "open",
      parties: [{ contactId: source.id, role: "owed_by" }],
    });
    createNeedOffer({ workspaceId, contactId: source.id, type: "need", status: "open" });
    createRelationshipEdge({
      workspaceId,
      fromContactId: source.id,
      toContactId: survivor.id,
      introducedByContactId: source.id,
    });

    const merged = mergeContacts({
      workspaceId,
      survivorId: survivor.id,
      sourceIds: [source.id],
      selections: { name: source.id },
    });

    expect(merged).toBeDefined();
    expect(merged?.name).toBe("Alfa");
    expect(merged?.tags).toEqual(expect.arrayContaining(["core", "vip"]));
    expect(merged?.aliases).toEqual(expect.arrayContaining(["Альфа"]));
    expect(merged?.channels).toHaveLength(2);

    const contacts = listAllContacts(workspaceId);
    expect(contacts).toHaveLength(1);
    expect(contacts[0]?.id).toBe(survivor.id);

    const relations = listRelations(workspaceId);
    expect(relations.communityMemberships[0]?.contactId).toBe(survivor.id);
    expect(relations.interactionParticipants[0]?.contactId).toBe(survivor.id);
    expect(relations.needsOffers[0]?.contactId).toBe(survivor.id);
    expect(relations.relationshipEdges[0]?.fromContactId).toBe(survivor.id);
    expect(relations.relationshipEdges[0]?.introducedByContactId).toBe(survivor.id);

    const commitments = listCommitmentsForContact({
      workspaceId,
      contactId: survivor.id,
      roles: ["owed_by"],
    });
    expect(commitments).toHaveLength(1);
    expect(commitments[0]?.parties[0]?.contactId).toBe(survivor.id);
  });

  it("does not mutate state when merge fails", () => {
    const workspaceId = "ws-merge";
    const survivor = createContact({ workspaceId, name: "Alpha" });
    createCommunityMembership({
      workspaceId,
      communityId: "community-1",
      contactId: survivor.id,
    });

    const merged = mergeContacts({
      workspaceId,
      survivorId: survivor.id,
      sourceIds: ["missing-contact"],
    });

    expect(merged).toBeUndefined();
    expect(listAllContacts(workspaceId)).toHaveLength(1);
    const relations = listRelations(workspaceId);
    expect(relations.communityMemberships[0]?.contactId).toBe(survivor.id);
  });
});
