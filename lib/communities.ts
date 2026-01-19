import { randomUUID } from "crypto";

import { getContact, listAllContacts, updateContact } from "@/lib/contacts";
import { canCreateRecords, canManageCommunities } from "@/lib/rbac";
import { addAuditLog, Role } from "@/lib/store";

export type CommunityLink = {
  id: string;
  label?: string;
  url: string;
};

export type Community = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  rules: string[];
  entryRequirements: string[];
  links: CommunityLink[];
  createdAt: string;
  updatedAt: string;
};

export type CommunityMembership = {
  id: string;
  workspaceId: string;
  communityId: string;
  contactId: string;
  role?: string;
  joinedAt?: string;
  leftAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunityLinkInput = {
  label?: string;
  url: string;
};

export type CommunityUpdates = {
  name?: string;
  description?: string;
  rules?: string[];
  entryRequirements?: string[];
  links?: CommunityLinkInput[];
};

type CommunitiesStore = {
  communities: Map<string, Community>;
  memberships: Map<string, CommunityMembership>;
};

const communitiesKey = Symbol.for("pcrm.communities");

function nowIso(): string {
  return new Date().toISOString();
}

function getCommunitiesStore(): CommunitiesStore {
  const globalStore = globalThis as unknown as Record<
    string | symbol,
    CommunitiesStore | undefined
  >;
  if (!globalStore[communitiesKey]) {
    globalStore[communitiesKey] = {
      communities: new Map(),
      memberships: new Map(),
    };
  }
  return globalStore[communitiesKey]!;
}

export function resetCommunitiesStore(): void {
  const store = getCommunitiesStore();
  store.communities = new Map();
  store.memberships = new Map();
}

function normalizeList(values?: string[]): string[] {
  if (!values) {
    return [];
  }
  return values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function normalizeLinks(links?: CommunityLinkInput[]): CommunityLink[] {
  if (!links) {
    return [];
  }
  return links
    .map((link) => ({
      id: randomUUID(),
      label: link.label?.trim() || undefined,
      url: link.url.trim(),
    }))
    .filter((link) => link.url.length > 0);
}

function findMembershipByCommunityContact(
  workspaceId: string,
  communityId: string,
  contactId: string
): CommunityMembership | undefined {
  const store = getCommunitiesStore();
  return Array.from(store.memberships.values()).find(
    (membership) =>
      membership.workspaceId === workspaceId &&
      membership.communityId === communityId &&
      membership.contactId === contactId
  );
}

function syncContactCommunityName(params: {
  workspaceId: string;
  contactId: string;
  previousName?: string;
  nextName?: string;
}): void {
  const contact = getContact({
    workspaceId: params.workspaceId,
    contactId: params.contactId,
  });
  if (!contact) {
    return;
  }
  const previousName = params.previousName?.trim();
  const nextName = params.nextName?.trim();
  let communities = contact.communities.slice();

  if (previousName) {
    communities = communities.filter((item) => item !== previousName);
  }

  if (nextName && !communities.includes(nextName)) {
    communities.push(nextName);
  }

  updateContact({
    workspaceId: params.workspaceId,
    contactId: params.contactId,
    updates: { communities },
  });
}

function syncContactsForCommunityRename(params: {
  workspaceId: string;
  communityId: string;
  previousName: string;
  nextName: string;
}): void {
  const store = getCommunitiesStore();
  const memberships = Array.from(store.memberships.values()).filter(
    (membership) =>
      membership.workspaceId === params.workspaceId &&
      membership.communityId === params.communityId
  );
  memberships.forEach((membership) =>
    syncContactCommunityName({
      workspaceId: params.workspaceId,
      contactId: membership.contactId,
      previousName: params.previousName,
      nextName: params.nextName,
    })
  );
}

function removeCommunityFromContacts(params: {
  workspaceId: string;
  communityId: string;
  communityName: string;
}): void {
  const store = getCommunitiesStore();
  const memberships = Array.from(store.memberships.values()).filter(
    (membership) =>
      membership.workspaceId === params.workspaceId &&
      membership.communityId === params.communityId
  );

  memberships.forEach((membership) =>
    syncContactCommunityName({
      workspaceId: params.workspaceId,
      contactId: membership.contactId,
      previousName: params.communityName,
    })
  );
}

export function createCommunity(params: {
  workspaceId: string;
  name: string;
  description?: string;
  rules?: string[];
  entryRequirements?: string[];
  links?: CommunityLinkInput[];
}): Community {
  const store = getCommunitiesStore();
  const createdAt = nowIso();
  const community: Community = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    name: params.name.trim(),
    description: params.description?.trim() || undefined,
    rules: normalizeList(params.rules),
    entryRequirements: normalizeList(params.entryRequirements),
    links: normalizeLinks(params.links),
    createdAt,
    updatedAt: createdAt,
  };
  store.communities.set(community.id, community);
  return community;
}

export function createCommunityWithRole(params: {
  role: Role;
  workspaceId: string;
  actorUserId: string | null;
  name: string;
  description?: string;
  rules?: string[];
  entryRequirements?: string[];
  links?: CommunityLinkInput[];
}): Community | undefined {
  if (!canCreateRecords(params.role)) {
    return undefined;
  }
  const community = createCommunity(params);
  addAuditLog({
    workspaceId: params.workspaceId,
    actorUserId: params.actorUserId,
    action: "community.created",
    metadata: {
      communityId: community.id,
      name: community.name,
    },
  });
  return community;
}

export function updateCommunity(params: {
  workspaceId: string;
  communityId: string;
  updates: CommunityUpdates;
}): Community | undefined {
  const store = getCommunitiesStore();
  const community = store.communities.get(params.communityId);
  if (!community || community.workspaceId !== params.workspaceId) {
    return undefined;
  }

  const nextName = params.updates.name?.trim();
  if (params.updates.name !== undefined && !nextName) {
    return undefined;
  }

  const updated: Community = {
    ...community,
    name: nextName ?? community.name,
    description:
      params.updates.description === undefined
        ? community.description
        : params.updates.description?.trim() || undefined,
    rules: params.updates.rules
      ? normalizeList(params.updates.rules)
      : community.rules,
    entryRequirements: params.updates.entryRequirements
      ? normalizeList(params.updates.entryRequirements)
      : community.entryRequirements,
    links: params.updates.links
      ? normalizeLinks(params.updates.links)
      : community.links,
    updatedAt: nowIso(),
  };

  store.communities.set(updated.id, updated);

  if (nextName && nextName !== community.name) {
    syncContactsForCommunityRename({
      workspaceId: params.workspaceId,
      communityId: params.communityId,
      previousName: community.name,
      nextName,
    });
  }

  return updated;
}

export function updateCommunityWithRole(params: {
  role: Role;
  workspaceId: string;
  actorUserId: string | null;
  communityId: string;
  updates: CommunityUpdates;
}): Community | undefined {
  if (!canManageCommunities(params.role)) {
    return undefined;
  }
  const community = updateCommunity(params);
  if (community) {
    addAuditLog({
      workspaceId: params.workspaceId,
      actorUserId: params.actorUserId,
      action: "community.updated",
      metadata: {
        communityId: community.id,
        name: community.name,
      },
    });
  }
  return community;
}

export function deleteCommunity(params: {
  workspaceId: string;
  communityId: string;
}): boolean {
  const store = getCommunitiesStore();
  const community = store.communities.get(params.communityId);
  if (!community || community.workspaceId !== params.workspaceId) {
    return false;
  }

  removeCommunityFromContacts({
    workspaceId: params.workspaceId,
    communityId: params.communityId,
    communityName: community.name,
  });

  store.communities.delete(params.communityId);
  store.memberships = new Map(
    Array.from(store.memberships.values())
      .filter((membership) =>
        !(
          membership.workspaceId === params.workspaceId &&
          membership.communityId === params.communityId
        )
      )
      .map((membership) => [membership.id, membership])
  );
  return true;
}

export function deleteCommunityWithRole(params: {
  role: Role;
  workspaceId: string;
  actorUserId: string | null;
  communityId: string;
}): boolean {
  if (!canManageCommunities(params.role)) {
    return false;
  }
  const deleted = deleteCommunity(params);
  if (deleted) {
    addAuditLog({
      workspaceId: params.workspaceId,
      actorUserId: params.actorUserId,
      action: "community.deleted",
      metadata: {
        communityId: params.communityId,
      },
    });
  }
  return deleted;
}

export function getCommunity(params: {
  workspaceId: string;
  communityId: string;
}): Community | undefined {
  const store = getCommunitiesStore();
  const community = store.communities.get(params.communityId);
  if (!community || community.workspaceId !== params.workspaceId) {
    return undefined;
  }
  return community;
}

export function listCommunities(workspaceId: string): Community[] {
  const store = getCommunitiesStore();
  return Array.from(store.communities.values())
    .filter((community) => community.workspaceId === workspaceId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function listCommunityMemberships(params: {
  workspaceId: string;
  communityId?: string;
  contactId?: string;
}): CommunityMembership[] {
  const store = getCommunitiesStore();
  return Array.from(store.memberships.values()).filter((membership) => {
    if (membership.workspaceId !== params.workspaceId) {
      return false;
    }
    if (params.communityId && membership.communityId !== params.communityId) {
      return false;
    }
    if (params.contactId && membership.contactId !== params.contactId) {
      return false;
    }
    return true;
  });
}

export function createCommunityMembership(params: {
  workspaceId: string;
  communityId: string;
  contactId: string;
  role?: string;
  joinedAt?: string;
  leftAt?: string;
}): CommunityMembership | undefined {
  const store = getCommunitiesStore();
  const community = store.communities.get(params.communityId);
  if (!community || community.workspaceId !== params.workspaceId) {
    return undefined;
  }
  const contact = getContact({
    workspaceId: params.workspaceId,
    contactId: params.contactId,
  });
  if (!contact) {
    return undefined;
  }

  const existing = findMembershipByCommunityContact(
    params.workspaceId,
    params.communityId,
    params.contactId
  );
  if (existing) {
    return existing;
  }

  const createdAt = nowIso();
  const membership: CommunityMembership = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    communityId: params.communityId,
    contactId: params.contactId,
    role: params.role?.trim() || undefined,
    joinedAt: params.joinedAt,
    leftAt: params.leftAt,
    createdAt,
    updatedAt: createdAt,
  };
  store.memberships.set(membership.id, membership);

  syncContactCommunityName({
    workspaceId: params.workspaceId,
    contactId: params.contactId,
    nextName: community.name,
  });

  return membership;
}

export function createCommunityMembershipWithRole(params: {
  role: Role;
  workspaceId: string;
  actorUserId: string | null;
  communityId: string;
  contactId: string;
  roleName?: string;
  joinedAt?: string;
  leftAt?: string;
}): CommunityMembership | undefined {
  if (!canManageCommunities(params.role)) {
    return undefined;
  }
  const membership = createCommunityMembership({
    workspaceId: params.workspaceId,
    communityId: params.communityId,
    contactId: params.contactId,
    role: params.roleName,
    joinedAt: params.joinedAt,
    leftAt: params.leftAt,
  });
  if (membership) {
    addAuditLog({
      workspaceId: params.workspaceId,
      actorUserId: params.actorUserId,
      action: "community.membership.created",
      metadata: {
        communityId: params.communityId,
        membershipId: membership.id,
        contactId: params.contactId,
      },
    });
  }
  return membership;
}

export function updateCommunityMembership(params: {
  workspaceId: string;
  membershipId: string;
  updates: Partial<
    Omit<CommunityMembership, "id" | "workspaceId" | "communityId" | "contactId" | "createdAt" | "updatedAt">
  >;
}): CommunityMembership | undefined {
  const store = getCommunitiesStore();
  const membership = store.memberships.get(params.membershipId);
  if (!membership || membership.workspaceId !== params.workspaceId) {
    return undefined;
  }

  const updated: CommunityMembership = {
    ...membership,
    role:
      params.updates.role === undefined
        ? membership.role
        : params.updates.role?.trim() || undefined,
    joinedAt:
      params.updates.joinedAt === undefined
        ? membership.joinedAt
        : params.updates.joinedAt,
    leftAt:
      params.updates.leftAt === undefined
        ? membership.leftAt
        : params.updates.leftAt,
    updatedAt: nowIso(),
  };

  store.memberships.set(updated.id, updated);
  return updated;
}

export function updateCommunityMembershipWithRole(params: {
  role: Role;
  workspaceId: string;
  actorUserId: string | null;
  membershipId: string;
  updates: Partial<
    Omit<CommunityMembership, "id" | "workspaceId" | "communityId" | "contactId" | "createdAt" | "updatedAt">
  >;
}): CommunityMembership | undefined {
  if (!canManageCommunities(params.role)) {
    return undefined;
  }
  const membership = updateCommunityMembership(params);
  if (membership) {
    addAuditLog({
      workspaceId: params.workspaceId,
      actorUserId: params.actorUserId,
      action: "community.membership.updated",
      metadata: {
        communityId: membership.communityId,
        membershipId: membership.id,
        contactId: membership.contactId,
      },
    });
  }
  return membership;
}

export function removeCommunityMembership(params: {
  workspaceId: string;
  membershipId: string;
}): boolean {
  const store = getCommunitiesStore();
  const membership = store.memberships.get(params.membershipId);
  if (!membership || membership.workspaceId !== params.workspaceId) {
    return false;
  }

  const community = store.communities.get(membership.communityId);
  if (community) {
    syncContactCommunityName({
      workspaceId: params.workspaceId,
      contactId: membership.contactId,
      previousName: community.name,
    });
  }

  store.memberships.delete(params.membershipId);
  return true;
}

export function removeCommunityMembershipWithRole(params: {
  role: Role;
  workspaceId: string;
  actorUserId: string | null;
  membershipId: string;
}): boolean {
  if (!canManageCommunities(params.role)) {
    return false;
  }
  const removed = removeCommunityMembership(params);
  if (removed) {
    addAuditLog({
      workspaceId: params.workspaceId,
      actorUserId: params.actorUserId,
      action: "community.membership.removed",
      metadata: {
        membershipId: params.membershipId,
      },
    });
  }
  return removed;
}

export function listCommunityMemberContacts(params: {
  workspaceId: string;
  communityId: string;
}): string[] {
  const store = getCommunitiesStore();
  return Array.from(store.memberships.values())
    .filter(
      (membership) =>
        membership.workspaceId === params.workspaceId &&
        membership.communityId === params.communityId
    )
    .map((membership) => membership.contactId);
}

export function listContactsByCommunityName(params: {
  workspaceId: string;
  communityName: string;
}): string[] {
  const contacts = listAllContacts(params.workspaceId);
  const name = params.communityName.toLowerCase();
  return contacts
    .filter((contact) =>
      contact.communities.some((community) => community.toLowerCase() === name)
    )
    .map((contact) => contact.id);
}
