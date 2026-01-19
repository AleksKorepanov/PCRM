import { randomUUID } from "crypto";

import { getContact, updateContact } from "@/lib/contacts";
import {
  InteractionParticipant,
  listRelations,
  removeInteractionParticipants,
  replaceInteractionParticipants,
  listInteractionParticipantsForInteraction,
} from "@/lib/relations";
import { roleAtLeast } from "@/lib/rbac";
import { Role } from "@/lib/store";

export type InteractionType =
  | "meeting"
  | "call"
  | "message"
  | "email"
  | "note"
  | "event";

export type InteractionPrivacyLevel = "private" | "workspace" | "restricted";

export type InteractionLink = {
  id: string;
  url: string;
  label?: string;
};

export type Interaction = {
  id: string;
  workspaceId: string;
  subject: string;
  summary?: string;
  interactionType: InteractionType;
  occurredAt: string;
  privacyLevel: InteractionPrivacyLevel;
  createdBy?: string;
  organizations: string[];
  communities: string[];
  links: InteractionLink[];
  createdAt: string;
  updatedAt: string;
};

export type InteractionFollowup = {
  id: string;
  workspaceId: string;
  interactionId: string;
  assignedToUserId?: string;
  dueAt?: string;
  status: "open" | "done" | "snoozed";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type InteractionParticipantInput = {
  contactId: string;
  role?: string;
};

export type InteractionWithRelations = Interaction & {
  participants: InteractionParticipant[];
  followups: InteractionFollowup[];
};

export type ListInteractionsParams = {
  workspaceId: string;
  role: Role;
  query?: string;
  contactId?: string;
  page?: number;
  perPage?: number;
};

export type ListInteractionsResult = {
  interactions: InteractionWithRelations[];
  total: number;
  page: number;
  perPage: number;
};

type InteractionsStore = {
  interactions: Map<string, Interaction>;
  followups: Map<string, InteractionFollowup>;
};

const interactionsKey = Symbol.for("pcrm.interactions");

function nowIso(): string {
  return new Date().toISOString();
}

function getInteractionsStore(): InteractionsStore {
  const globalStore = globalThis as unknown as Record<
    string | symbol,
    InteractionsStore | undefined
  >;
  if (!globalStore[interactionsKey]) {
    globalStore[interactionsKey] = {
      interactions: new Map(),
      followups: new Map(),
    };
  }
  return globalStore[interactionsKey]!;
}

export function resetInteractionsStore(): void {
  const store = getInteractionsStore();
  store.interactions = new Map();
  store.followups = new Map();
}

function normalizeList(values?: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  values
    ?.map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      result.push(value);
    });
  return result;
}

function matchesQuery(interaction: Interaction, query?: string): boolean {
  if (!query) {
    return true;
  }
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  const haystack = `${interaction.subject} ${interaction.summary ?? ""}`.toLowerCase();
  return haystack.includes(normalized);
}

export function canViewInteraction(
  role: Role,
  interaction: Interaction
): boolean {
  switch (interaction.privacyLevel) {
    case "private":
      return roleAtLeast(role, "member");
    case "restricted":
      return roleAtLeast(role, "admin");
    default:
      return true;
  }
}

function hydrateInteraction(
  interaction: Interaction
): InteractionWithRelations {
  const participants = listInteractionParticipantsForInteraction({
    workspaceId: interaction.workspaceId,
    interactionId: interaction.id,
  });
  const followups = listFollowupsForInteraction({
    workspaceId: interaction.workspaceId,
    interactionId: interaction.id,
  });
  return { ...interaction, participants, followups };
}

function updateContactLastInteraction(
  workspaceId: string,
  contactId: string,
  occurredAt: string
): void {
  const contact = getContact({ workspaceId, contactId });
  if (!contact) {
    return;
  }
  const existing = contact.lastInteractionAt;
  if (!existing || new Date(occurredAt).getTime() > new Date(existing).getTime()) {
    updateContact({
      contactId,
      workspaceId,
      updates: { lastInteractionAt: occurredAt },
    });
  }
}

export function createInteraction(params: {
  workspaceId: string;
  subject: string;
  summary?: string;
  interactionType: InteractionType;
  occurredAt: string;
  privacyLevel?: InteractionPrivacyLevel;
  createdBy?: string;
  participants?: InteractionParticipantInput[];
  organizations?: string[];
  communities?: string[];
  links?: { url: string; label?: string }[];
}): InteractionWithRelations {
  const store = getInteractionsStore();
  const createdAt = nowIso();
  const interaction: Interaction = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    subject: params.subject.trim(),
    summary: params.summary?.trim() || undefined,
    interactionType: params.interactionType,
    occurredAt: params.occurredAt,
    privacyLevel: params.privacyLevel ?? "workspace",
    createdBy: params.createdBy,
    organizations: normalizeList(params.organizations),
    communities: normalizeList(params.communities),
    links:
      params.links?.map((link) => ({
        id: randomUUID(),
        url: link.url.trim(),
        label: link.label?.trim() || undefined,
      })) ?? [],
    createdAt,
    updatedAt: createdAt,
  };

  store.interactions.set(interaction.id, interaction);
  const participants = params.participants ?? [];
  replaceInteractionParticipants({
    workspaceId: params.workspaceId,
    interactionId: interaction.id,
    participants,
  });
  participants.forEach((participant) =>
    updateContactLastInteraction(params.workspaceId, participant.contactId, params.occurredAt)
  );

  return hydrateInteraction(interaction);
}

export function getInteraction(params: {
  workspaceId: string;
  interactionId: string;
}): InteractionWithRelations | undefined {
  const store = getInteractionsStore();
  const interaction = store.interactions.get(params.interactionId);
  if (!interaction || interaction.workspaceId !== params.workspaceId) {
    return undefined;
  }
  return hydrateInteraction(interaction);
}

export function updateInteraction(params: {
  workspaceId: string;
  interactionId: string;
  updates: Partial<
    Omit<
      Interaction,
      "id" | "workspaceId" | "createdAt" | "updatedAt" | "links"
    >
  > & {
    links?: { url: string; label?: string }[];
    participants?: InteractionParticipantInput[];
  };
}): InteractionWithRelations | undefined {
  const store = getInteractionsStore();
  const interaction = store.interactions.get(params.interactionId);
  if (!interaction || interaction.workspaceId !== params.workspaceId) {
    return undefined;
  }

  const updated: Interaction = {
    ...interaction,
    subject: params.updates.subject?.trim() ?? interaction.subject,
    summary: params.updates.summary?.trim() ?? interaction.summary,
    interactionType: params.updates.interactionType ?? interaction.interactionType,
    occurredAt: params.updates.occurredAt ?? interaction.occurredAt,
    privacyLevel: params.updates.privacyLevel ?? interaction.privacyLevel,
    createdBy: params.updates.createdBy ?? interaction.createdBy,
    organizations: params.updates.organizations
      ? normalizeList(params.updates.organizations)
      : interaction.organizations,
    communities: params.updates.communities
      ? normalizeList(params.updates.communities)
      : interaction.communities,
    links: params.updates.links
      ? params.updates.links.map((link) => ({
          id: randomUUID(),
          url: link.url.trim(),
          label: link.label?.trim() || undefined,
        }))
      : interaction.links,
    updatedAt: nowIso(),
  };

  store.interactions.set(interaction.id, updated);

  if (params.updates.participants) {
    replaceInteractionParticipants({
      workspaceId: params.workspaceId,
      interactionId: interaction.id,
      participants: params.updates.participants,
    });
    params.updates.participants.forEach((participant) =>
      updateContactLastInteraction(params.workspaceId, participant.contactId, updated.occurredAt)
    );
  }

  return hydrateInteraction(updated);
}

export function deleteInteraction(params: {
  workspaceId: string;
  interactionId: string;
}): boolean {
  const store = getInteractionsStore();
  const interaction = store.interactions.get(params.interactionId);
  if (!interaction || interaction.workspaceId !== params.workspaceId) {
    return false;
  }
  store.interactions.delete(params.interactionId);
  removeInteractionParticipants({
    workspaceId: params.workspaceId,
    interactionId: params.interactionId,
  });
  store.followups.forEach((followup, key) => {
    if (
      followup.workspaceId === params.workspaceId &&
      followup.interactionId === params.interactionId
    ) {
      store.followups.delete(key);
    }
  });
  return true;
}

export function listInteractions(params: ListInteractionsParams): ListInteractionsResult {
  const store = getInteractionsStore();
  const page = params.page && params.page > 0 ? params.page : 1;
  const perPage = params.perPage && params.perPage > 0 ? params.perPage : 20;

  const participants = listRelations(params.workspaceId).interactionParticipants;
  const contactInteractionIds = params.contactId
    ? new Set(
        participants
          .filter((item) => item.contactId === params.contactId)
          .map((item) => item.interactionId)
      )
    : undefined;

  let interactions = Array.from(store.interactions.values()).filter(
    (interaction) => interaction.workspaceId === params.workspaceId
  );

  if (contactInteractionIds) {
    interactions = interactions.filter((interaction) =>
      contactInteractionIds.has(interaction.id)
    );
  }

  interactions = interactions.filter((interaction) =>
    canViewInteraction(params.role, interaction)
  );

  if (params.query) {
    interactions = interactions.filter((interaction) =>
      matchesQuery(interaction, params.query)
    );
  }

  interactions.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  const total = interactions.length;
  const start = (page - 1) * perPage;
  const end = start + perPage;

  return {
    interactions: interactions.slice(start, end).map(hydrateInteraction),
    total,
    page,
    perPage,
  };
}

export function listFollowupsForInteraction(params: {
  workspaceId: string;
  interactionId: string;
}): InteractionFollowup[] {
  const store = getInteractionsStore();
  return Array.from(store.followups.values())
    .filter(
      (followup) =>
        followup.workspaceId === params.workspaceId &&
        followup.interactionId === params.interactionId
    )
    .sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""));
}

export function createFollowup(params: {
  workspaceId: string;
  interactionId: string;
  assignedToUserId?: string;
  dueAt?: string;
  status?: InteractionFollowup["status"];
  notes?: string;
}): InteractionFollowup | undefined {
  const store = getInteractionsStore();
  const interaction = store.interactions.get(params.interactionId);
  if (!interaction || interaction.workspaceId !== params.workspaceId) {
    return undefined;
  }
  const createdAt = nowIso();
  const followup: InteractionFollowup = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    interactionId: params.interactionId,
    assignedToUserId: params.assignedToUserId,
    dueAt: params.dueAt,
    status: params.status ?? "open",
    notes: params.notes?.trim() || undefined,
    createdAt,
    updatedAt: createdAt,
  };
  store.followups.set(followup.id, followup);
  return followup;
}

export function updateFollowup(params: {
  workspaceId: string;
  followupId: string;
  updates: Partial<
    Omit<InteractionFollowup, "id" | "workspaceId" | "interactionId" | "createdAt">
  >;
}): InteractionFollowup | undefined {
  const store = getInteractionsStore();
  const followup = store.followups.get(params.followupId);
  if (!followup || followup.workspaceId !== params.workspaceId) {
    return undefined;
  }
  const updated: InteractionFollowup = {
    ...followup,
    assignedToUserId:
      params.updates.assignedToUserId ?? followup.assignedToUserId,
    dueAt: params.updates.dueAt ?? followup.dueAt,
    status: params.updates.status ?? followup.status,
    notes: params.updates.notes?.trim() ?? followup.notes,
    updatedAt: nowIso(),
  };
  store.followups.set(followup.id, updated);
  return updated;
}

export function deleteFollowup(params: {
  workspaceId: string;
  followupId: string;
}): boolean {
  const store = getInteractionsStore();
  const followup = store.followups.get(params.followupId);
  if (!followup || followup.workspaceId !== params.workspaceId) {
    return false;
  }
  store.followups.delete(params.followupId);
  return true;
}

export function searchInteractions(params: {
  workspaceId: string;
  role: Role;
  query: string;
}): InteractionWithRelations[] {
  return listInteractions({
    workspaceId: params.workspaceId,
    role: params.role,
    query: params.query,
    page: 1,
    perPage: 50,
  }).interactions;
}
