import { randomUUID } from "crypto";

export type CommunityMembership = {
  id: string;
  workspaceId: string;
  communityId: string;
  contactId: string;
  role?: string;
  joinedAt?: string;
  createdAt: string;
};

export type InteractionParticipant = {
  id: string;
  workspaceId: string;
  interactionId: string;
  contactId: string;
  role?: string;
  createdAt: string;
};

export type NeedOfferRecord = {
  id: string;
  workspaceId: string;
  contactId: string;
  type: "need" | "offer";
  status: "open" | "matched" | "closed";
  createdAt: string;
};

export type RelationshipEdge = {
  id: string;
  workspaceId: string;
  fromContactId: string;
  toContactId: string;
  introducedByContactId?: string;
  createdAt: string;
};

type RelationsStore = {
  communityMemberships: CommunityMembership[];
  interactionParticipants: InteractionParticipant[];
  needsOffers: NeedOfferRecord[];
  relationshipEdges: RelationshipEdge[];
};

export type RelationsSnapshot = RelationsStore;

const relationsKey = Symbol.for("pcrm.relations");

function nowIso(): string {
  return new Date().toISOString();
}

function getRelationsStore(): RelationsStore {
  const globalStore = globalThis as unknown as Record<
    string | symbol,
    RelationsStore | undefined
  >;
  if (!globalStore[relationsKey]) {
    globalStore[relationsKey] = {
      communityMemberships: [],
      interactionParticipants: [],
      needsOffers: [],
      relationshipEdges: [],
    };
  }
  return globalStore[relationsKey]!;
}

export function resetRelationsStore(): void {
  const store = getRelationsStore();
  store.communityMemberships = [];
  store.interactionParticipants = [];
  store.needsOffers = [];
  store.relationshipEdges = [];
}

export function createCommunityMembership(params: {
  workspaceId: string;
  communityId: string;
  contactId: string;
  role?: string;
  joinedAt?: string;
}): CommunityMembership {
  const store = getRelationsStore();
  const membership: CommunityMembership = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    communityId: params.communityId,
    contactId: params.contactId,
    role: params.role,
    joinedAt: params.joinedAt,
    createdAt: nowIso(),
  };
  store.communityMemberships.push(membership);
  return membership;
}

export function createInteractionParticipant(params: {
  workspaceId: string;
  interactionId: string;
  contactId: string;
  role?: string;
}): InteractionParticipant {
  const store = getRelationsStore();
  const participant: InteractionParticipant = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    interactionId: params.interactionId,
    contactId: params.contactId,
    role: params.role,
    createdAt: nowIso(),
  };
  store.interactionParticipants.push(participant);
  return participant;
}

export function listInteractionParticipantsForInteraction(params: {
  workspaceId: string;
  interactionId: string;
}): InteractionParticipant[] {
  const store = getRelationsStore();
  return store.interactionParticipants.filter(
    (participant) =>
      participant.workspaceId === params.workspaceId &&
      participant.interactionId === params.interactionId
  );
}

export function replaceInteractionParticipants(params: {
  workspaceId: string;
  interactionId: string;
  participants: { contactId: string; role?: string }[];
}): InteractionParticipant[] {
  const store = getRelationsStore();
  store.interactionParticipants = store.interactionParticipants.filter(
    (participant) =>
      !(
        participant.workspaceId === params.workspaceId &&
        participant.interactionId === params.interactionId
      )
  );
  const created = params.participants.map((participant) =>
    createInteractionParticipant({
      workspaceId: params.workspaceId,
      interactionId: params.interactionId,
      contactId: participant.contactId,
      role: participant.role,
    })
  );
  return created;
}

export function removeInteractionParticipants(params: {
  workspaceId: string;
  interactionId: string;
}): void {
  const store = getRelationsStore();
  store.interactionParticipants = store.interactionParticipants.filter(
    (participant) =>
      !(
        participant.workspaceId === params.workspaceId &&
        participant.interactionId === params.interactionId
      )
  );
}

export function createNeedOffer(params: {
  workspaceId: string;
  contactId: string;
  type: NeedOfferRecord["type"];
  status: NeedOfferRecord["status"];
}): NeedOfferRecord {
  const store = getRelationsStore();
  const record: NeedOfferRecord = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    contactId: params.contactId,
    type: params.type,
    status: params.status,
    createdAt: nowIso(),
  };
  store.needsOffers.push(record);
  return record;
}

export function createRelationshipEdge(params: {
  workspaceId: string;
  fromContactId: string;
  toContactId: string;
  introducedByContactId?: string;
}): RelationshipEdge {
  const store = getRelationsStore();
  const edge: RelationshipEdge = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    fromContactId: params.fromContactId,
    toContactId: params.toContactId,
    introducedByContactId: params.introducedByContactId,
    createdAt: nowIso(),
  };
  store.relationshipEdges.push(edge);
  return edge;
}

export function listRelations(workspaceId: string): RelationsStore {
  const store = getRelationsStore();
  return {
    communityMemberships: store.communityMemberships.filter(
      (item) => item.workspaceId === workspaceId
    ),
    interactionParticipants: store.interactionParticipants.filter(
      (item) => item.workspaceId === workspaceId
    ),
    needsOffers: store.needsOffers.filter((item) => item.workspaceId === workspaceId),
    relationshipEdges: store.relationshipEdges.filter(
      (item) => item.workspaceId === workspaceId
    ),
  };
}

export function snapshotRelations(): RelationsSnapshot {
  const store = getRelationsStore();
  return {
    communityMemberships: [...store.communityMemberships],
    interactionParticipants: [...store.interactionParticipants],
    needsOffers: [...store.needsOffers],
    relationshipEdges: [...store.relationshipEdges],
  };
}

export function restoreRelations(snapshot: RelationsSnapshot): void {
  const store = getRelationsStore();
  store.communityMemberships = [...snapshot.communityMemberships];
  store.interactionParticipants = [...snapshot.interactionParticipants];
  store.needsOffers = [...snapshot.needsOffers];
  store.relationshipEdges = [...snapshot.relationshipEdges];
}

export function reassignContactRelations(params: {
  workspaceId: string;
  fromContactId: string;
  toContactId: string;
}): void {
  const store = getRelationsStore();
  const { workspaceId, fromContactId, toContactId } = params;

  store.communityMemberships = store.communityMemberships.map((membership) =>
    membership.workspaceId === workspaceId && membership.contactId === fromContactId
      ? { ...membership, contactId: toContactId }
      : membership
  );

  store.interactionParticipants = store.interactionParticipants.map((participant) =>
    participant.workspaceId === workspaceId && participant.contactId === fromContactId
      ? { ...participant, contactId: toContactId }
      : participant
  );

  store.needsOffers = store.needsOffers.map((record) =>
    record.workspaceId === workspaceId && record.contactId === fromContactId
      ? { ...record, contactId: toContactId }
      : record
  );

  store.relationshipEdges = store.relationshipEdges.map((edge) => {
    if (edge.workspaceId !== workspaceId) {
      return edge;
    }
    return {
      ...edge,
      fromContactId: edge.fromContactId === fromContactId ? toContactId : edge.fromContactId,
      toContactId: edge.toContactId === fromContactId ? toContactId : edge.toContactId,
      introducedByContactId:
        edge.introducedByContactId === fromContactId
          ? toContactId
          : edge.introducedByContactId,
    };
  });
}
