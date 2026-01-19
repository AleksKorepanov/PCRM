import { randomUUID } from "crypto";

import { canManageCommitments } from "@/lib/rbac";
import { Role } from "@/lib/store";

export type CommitmentStatus =
  | "open"
  | "in_progress"
  | "fulfilled"
  | "broken"
  | "canceled";

export type CommitmentPartyRole = "owed_by" | "owes_to" | "observer";

export type Commitment = {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  status: CommitmentStatus;
  dueAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CommitmentParty = {
  id: string;
  commitmentId: string;
  contactId: string;
  role: CommitmentPartyRole;
  createdAt: string;
};

export type CommitmentPartyInput = {
  contactId: string;
  role: CommitmentPartyRole;
};

export type CommitmentWithParties = Commitment & {
  parties: CommitmentParty[];
};

export type CommitmentReliability = {
  totalWithDueDates: number;
  closedWithDueDates: number;
  onTimeClosed: number;
  lateClosed: number;
  overdueOpen: number;
  onTimeClosureRatio: number | null;
  overdueRate: number | null;
};

type CommitmentsStore = {
  commitments: Map<string, Commitment>;
  parties: Map<string, CommitmentParty>;
};

export type CommitmentsSnapshot = {
  commitments: Commitment[];
  parties: CommitmentParty[];
};

const commitmentsKey = Symbol.for("pcrm.commitments");

function nowIso(): string {
  return new Date().toISOString();
}

function getCommitmentsStore(): CommitmentsStore {
  const globalStore = globalThis as unknown as Record<
    string | symbol,
    CommitmentsStore | undefined
  >;
  if (!globalStore[commitmentsKey]) {
    globalStore[commitmentsKey] = {
      commitments: new Map(),
      parties: new Map(),
    };
  }
  return globalStore[commitmentsKey]!;
}

export function resetCommitmentsStore(): void {
  const store = getCommitmentsStore();
  store.commitments = new Map();
  store.parties = new Map();
}

function normalizeText(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function isClosedStatus(status: CommitmentStatus): boolean {
  return status === "fulfilled" || status === "broken" || status === "canceled";
}

function resolveClosedAt(status: CommitmentStatus, closedAt?: string): string | undefined {
  if (!isClosedStatus(status)) {
    return undefined;
  }
  return closedAt ?? nowIso();
}

function hydrateCommitment(commitment: Commitment): CommitmentWithParties {
  const store = getCommitmentsStore();
  const parties = Array.from(store.parties.values()).filter(
    (party) => party.commitmentId === commitment.id
  );
  return { ...commitment, parties };
}

function createCommitmentParty(params: {
  commitmentId: string;
  contactId: string;
  role: CommitmentPartyRole;
}): CommitmentParty {
  const store = getCommitmentsStore();
  const party: CommitmentParty = {
    id: randomUUID(),
    commitmentId: params.commitmentId,
    contactId: params.contactId,
    role: params.role,
    createdAt: nowIso(),
  };
  store.parties.set(party.id, party);
  return party;
}

function replaceCommitmentParties(params: {
  commitmentId: string;
  parties: CommitmentPartyInput[];
}): CommitmentParty[] {
  const store = getCommitmentsStore();
  const existing = Array.from(store.parties.values()).filter(
    (party) => party.commitmentId === params.commitmentId
  );
  existing.forEach((party) => store.parties.delete(party.id));
  return params.parties.map((party) =>
    createCommitmentParty({
      commitmentId: params.commitmentId,
      contactId: party.contactId,
      role: party.role,
    })
  );
}

export function createCommitment(params: {
  workspaceId: string;
  title: string;
  description?: string;
  status?: CommitmentStatus;
  dueAt?: string;
  closedAt?: string;
  parties?: CommitmentPartyInput[];
}): CommitmentWithParties {
  const store = getCommitmentsStore();
  const createdAt = nowIso();
  const status = params.status ?? "open";
  const commitment: Commitment = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    title: params.title.trim(),
    description: normalizeText(params.description),
    status,
    dueAt: params.dueAt,
    closedAt: resolveClosedAt(status, params.closedAt),
    createdAt,
    updatedAt: createdAt,
  };
  store.commitments.set(commitment.id, commitment);

  const parties = params.parties?.map((party) =>
    createCommitmentParty({
      commitmentId: commitment.id,
      contactId: party.contactId,
      role: party.role,
    })
  );

  return { ...commitment, parties: parties ?? [] };
}

export function createCommitmentWithRole(params: {
  role: Role;
  workspaceId: string;
  title: string;
  description?: string;
  status?: CommitmentStatus;
  dueAt?: string;
  closedAt?: string;
  parties?: CommitmentPartyInput[];
}): CommitmentWithParties | undefined {
  if (!canManageCommitments(params.role)) {
    return undefined;
  }
  return createCommitment(params);
}

export function getCommitment(params: {
  workspaceId: string;
  commitmentId: string;
}): CommitmentWithParties | undefined {
  const store = getCommitmentsStore();
  const commitment = store.commitments.get(params.commitmentId);
  if (!commitment || commitment.workspaceId !== params.workspaceId) {
    return undefined;
  }
  return hydrateCommitment(commitment);
}

export function listCommitments(params: {
  workspaceId: string;
  status?: CommitmentStatus | CommitmentStatus[];
}): CommitmentWithParties[] {
  const store = getCommitmentsStore();
  const statuses = Array.isArray(params.status) ? params.status : [params.status];
  const validStatuses = statuses.filter(Boolean) as CommitmentStatus[];

  let commitments = Array.from(store.commitments.values()).filter(
    (commitment) => commitment.workspaceId === params.workspaceId
  );

  if (validStatuses.length > 0) {
    commitments = commitments.filter((commitment) =>
      validStatuses.includes(commitment.status)
    );
  }

  commitments.sort((a, b) => {
    if (a.dueAt && b.dueAt) {
      return a.dueAt.localeCompare(b.dueAt);
    }
    if (a.dueAt) {
      return -1;
    }
    if (b.dueAt) {
      return 1;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });

  return commitments.map(hydrateCommitment);
}

export function listCommitmentsForContact(params: {
  workspaceId: string;
  contactId: string;
  roles?: CommitmentPartyRole[];
}): CommitmentWithParties[] {
  const store = getCommitmentsStore();
  const roles = params.roles ?? ["owed_by", "owes_to", "observer"];
  const commitments = Array.from(store.commitments.values()).filter(
    (commitment) => commitment.workspaceId === params.workspaceId
  );

  return commitments
    .filter((commitment) => {
      const parties = Array.from(store.parties.values()).filter(
        (party) => party.commitmentId === commitment.id
      );
      return parties.some(
        (party) => party.contactId === params.contactId && roles.includes(party.role)
      );
    })
    .map(hydrateCommitment);
}

export function updateCommitment(params: {
  workspaceId: string;
  commitmentId: string;
  updates: Partial<
    Omit<Commitment, "id" | "workspaceId" | "createdAt" | "updatedAt">
  > & { parties?: CommitmentPartyInput[] };
}): CommitmentWithParties | undefined {
  const store = getCommitmentsStore();
  const commitment = store.commitments.get(params.commitmentId);
  if (!commitment || commitment.workspaceId !== params.workspaceId) {
    return undefined;
  }

  const status = params.updates.status ?? commitment.status;
  const closedAt = resolveClosedAt(status, params.updates.closedAt ?? commitment.closedAt);

  const description =
    params.updates.description !== undefined
      ? normalizeText(params.updates.description)
      : commitment.description;

  const updated: Commitment = {
    ...commitment,
    title: params.updates.title ? params.updates.title.trim() : commitment.title,
    description,
    status,
    dueAt: params.updates.dueAt ?? commitment.dueAt,
    closedAt,
    updatedAt: nowIso(),
  };

  store.commitments.set(commitment.id, updated);

  let parties = hydrateCommitment(updated).parties;
  if (params.updates.parties) {
    parties = replaceCommitmentParties({
      commitmentId: updated.id,
      parties: params.updates.parties,
    });
  }

  return { ...updated, parties };
}

export function updateCommitmentWithRole(params: {
  role: Role;
  workspaceId: string;
  commitmentId: string;
  updates: Partial<
    Omit<Commitment, "id" | "workspaceId" | "createdAt" | "updatedAt">
  > & { parties?: CommitmentPartyInput[] };
}): CommitmentWithParties | undefined {
  if (!canManageCommitments(params.role)) {
    return undefined;
  }
  return updateCommitment(params);
}

export function deleteCommitment(params: {
  workspaceId: string;
  commitmentId: string;
}): boolean {
  const store = getCommitmentsStore();
  const commitment = store.commitments.get(params.commitmentId);
  if (!commitment || commitment.workspaceId !== params.workspaceId) {
    return false;
  }
  store.commitments.delete(params.commitmentId);
  Array.from(store.parties.values()).forEach((party) => {
    if (party.commitmentId === params.commitmentId) {
      store.parties.delete(party.id);
    }
  });
  return true;
}

export function deleteCommitmentWithRole(params: {
  role: Role;
  workspaceId: string;
  commitmentId: string;
}): boolean {
  if (!canManageCommitments(params.role)) {
    return false;
  }
  return deleteCommitment(params);
}

export function isCommitmentOverdue(
  commitment: Commitment,
  now: Date = new Date()
): boolean {
  if (!commitment.dueAt) {
    return false;
  }
  if (commitment.status !== "open" && commitment.status !== "in_progress") {
    return false;
  }
  return new Date(commitment.dueAt).getTime() < now.getTime();
}

function isLateClosed(commitment: Commitment): boolean {
  if (!commitment.dueAt || !commitment.closedAt) {
    return false;
  }
  return new Date(commitment.closedAt).getTime() > new Date(commitment.dueAt).getTime();
}

export function getCommitmentReliability(params: {
  workspaceId: string;
  contactId: string;
  roles?: CommitmentPartyRole[];
}): CommitmentReliability {
  const commitments = listCommitmentsForContact({
    workspaceId: params.workspaceId,
    contactId: params.contactId,
    roles: params.roles ?? ["owed_by"],
  }).filter((commitment) => commitment.status !== "canceled");

  const withDueDates = commitments.filter((commitment) => commitment.dueAt);
  const closedWithDueDates = withDueDates.filter((commitment) =>
    isClosedStatus(commitment.status)
  );

  const onTimeClosed = closedWithDueDates.filter(
    (commitment) => commitment.closedAt && !isLateClosed(commitment)
  );
  const lateClosed = closedWithDueDates.filter((commitment) => isLateClosed(commitment));
  const overdueOpen = withDueDates.filter((commitment) =>
    isCommitmentOverdue(commitment)
  );

  const onTimeClosureRatio =
    closedWithDueDates.length > 0
      ? onTimeClosed.length / closedWithDueDates.length
      : null;

  const overdueRate =
    withDueDates.length > 0
      ? (overdueOpen.length + lateClosed.length) / withDueDates.length
      : null;

  return {
    totalWithDueDates: withDueDates.length,
    closedWithDueDates: closedWithDueDates.length,
    onTimeClosed: onTimeClosed.length,
    lateClosed: lateClosed.length,
    overdueOpen: overdueOpen.length,
    onTimeClosureRatio,
    overdueRate,
  };
}

export function snapshotCommitments(): CommitmentsSnapshot {
  const store = getCommitmentsStore();
  return {
    commitments: Array.from(store.commitments.values()),
    parties: Array.from(store.parties.values()),
  };
}

export function restoreCommitments(snapshot: CommitmentsSnapshot): void {
  const store = getCommitmentsStore();
  store.commitments = new Map(snapshot.commitments.map((item) => [item.id, item]));
  store.parties = new Map(snapshot.parties.map((item) => [item.id, item]));
}

export function reassignCommitmentParties(params: {
  workspaceId: string;
  fromContactId: string;
  toContactId: string;
}): void {
  const store = getCommitmentsStore();
  store.parties.forEach((party, key) => {
    if (party.contactId !== params.fromContactId) {
      return;
    }
    const commitment = store.commitments.get(party.commitmentId);
    if (!commitment || commitment.workspaceId !== params.workspaceId) {
      return;
    }
    store.parties.set(key, { ...party, contactId: params.toContactId });
  });
}
