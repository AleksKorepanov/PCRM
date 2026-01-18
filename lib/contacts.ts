import { randomUUID } from "crypto";

import { reassignContactRelations, restoreRelations, snapshotRelations } from "@/lib/relations";

export type ContactVisibility = "public" | "private";

export type ContactChannelType = "phone" | "email" | "telegram" | "whatsapp";

export type ContactChannel = {
  id: string;
  type: ContactChannelType;
  value: string;
  isPrimary: boolean;
};

export type ContactNote = {
  id: string;
  content: string;
  visibility: ContactVisibility;
  createdAt: string;
};

export type ContactFieldVisibility = Record<string, ContactVisibility>;

export type Contact = {
  id: string;
  workspaceId: string;
  name: string;
  city?: string;
  tier?: string;
  trustScore?: number;
  introducedBy?: string;
  aliases: string[];
  tags: string[];
  organizations: string[];
  communities: string[];
  channels: ContactChannel[];
  fieldVisibility: ContactFieldVisibility;
  notes: ContactNote[];
  lastInteractionAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ContactFilters = {
  tier?: string;
  city?: string;
  tags?: string[];
  trustScoreMin?: number;
  trustScoreMax?: number;
  organization?: string;
  community?: string;
};

export type ContactSort = "last_interaction" | "trust_score" | "name";

export type ContactMergeField =
  | "name"
  | "city"
  | "tier"
  | "trustScore"
  | "introducedBy";

export type ContactMergeSelection = Partial<Record<ContactMergeField, string>>;

export type ListContactsParams = {
  workspaceId: string;
  filters?: ContactFilters;
  sort?: ContactSort;
  page?: number;
  perPage?: number;
};

export type ListContactsResult = {
  contacts: Contact[];
  total: number;
  page: number;
  perPage: number;
};

type ContactsStore = {
  contacts: Map<string, Contact>;
};

const contactsKey = Symbol.for("pcrm.contacts");

function nowIso(): string {
  return new Date().toISOString();
}

function getContactsStore(): ContactsStore {
  const globalStore = globalThis as unknown as Record<
    string | symbol,
    ContactsStore | undefined
  >;
  if (!globalStore[contactsKey]) {
    globalStore[contactsKey] = { contacts: new Map() };
  }
  return globalStore[contactsKey]!;
}

export function resetContactsStore(): void {
  const store = getContactsStore();
  store.contacts = new Map();
}

function normalizeString(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

function resolveOptional(value: string | undefined, fallback: string | undefined): string | undefined {
  if (value === undefined) {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function matchesTags(contact: Contact, tags: string[]): boolean {
  if (tags.length === 0) {
    return true;
  }
  const contactTags = new Set(contact.tags.map(normalizeString));
  return tags.some((tag) => contactTags.has(normalizeString(tag)));
}

function inRange(value: number | undefined, min?: number, max?: number): boolean {
  if (value === undefined) {
    return false;
  }
  if (min !== undefined && value < min) {
    return false;
  }
  if (max !== undefined && value > max) {
    return false;
  }
  return true;
}

function uniqueList(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const normalized = value.trim();
    if (!normalized) {
      return;
    }
    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  });
  return result;
}

function mergeChannels(existing: ContactChannel[], incoming: ContactChannel[]): ContactChannel[] {
  const byKey = new Map<string, ContactChannel>();
  const all = [...existing, ...incoming];
  all.forEach((channel) => {
    const key = `${channel.type}:${normalizeString(channel.value)}`;
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, channel);
      return;
    }
    if (!current.isPrimary && channel.isPrimary) {
      byKey.set(key, { ...current, isPrimary: true });
    }
  });
  const merged = Array.from(byKey.values());
  if (!merged.some((channel) => channel.isPrimary) && merged.length > 0) {
    merged[0] = { ...merged[0], isPrimary: true };
  }
  return merged;
}

export function createContact(params: {
  workspaceId: string;
  name: string;
  city?: string;
  tier?: string;
  trustScore?: number;
  introducedBy?: string;
  aliases?: string[];
  tags?: string[];
  organizations?: string[];
  communities?: string[];
  channels?: ContactChannel[];
  fieldVisibility?: ContactFieldVisibility;
  notes?: ContactNote[];
  lastInteractionAt?: string;
}): Contact {
  const store = getContactsStore();
  const createdAt = nowIso();
  const contact: Contact = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    name: params.name.trim(),
    city: params.city?.trim() || undefined,
    tier: params.tier?.trim() || undefined,
    trustScore: params.trustScore,
    introducedBy: params.introducedBy?.trim() || undefined,
    aliases: params.aliases?.map((alias) => alias.trim()).filter(Boolean) ?? [],
    tags: params.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [],
    organizations:
      params.organizations?.map((org) => org.trim()).filter(Boolean) ?? [],
    communities:
      params.communities?.map((community) => community.trim()).filter(Boolean) ?? [],
    channels: params.channels ?? [],
    fieldVisibility: params.fieldVisibility ?? {},
    notes: params.notes ?? [],
    lastInteractionAt: params.lastInteractionAt,
    createdAt,
    updatedAt: createdAt,
  };
  store.contacts.set(contact.id, contact);
  return contact;
}

export function updateContact(params: {
  contactId: string;
  workspaceId: string;
  updates: Partial<Omit<Contact, "id" | "workspaceId" | "createdAt" | "updatedAt">>;
}): Contact | undefined {
  const store = getContactsStore();
  const contact = store.contacts.get(params.contactId);
  if (!contact || contact.workspaceId !== params.workspaceId) {
    return undefined;
  }
  const updated: Contact = {
    ...contact,
    ...params.updates,
    aliases: params.updates.aliases
      ? params.updates.aliases.map((alias) => alias.trim()).filter(Boolean)
      : contact.aliases,
    tags: params.updates.tags
      ? params.updates.tags.map((tag) => tag.trim()).filter(Boolean)
      : contact.tags,
    organizations: params.updates.organizations
      ? params.updates.organizations.map((org) => org.trim()).filter(Boolean)
      : contact.organizations,
    communities: params.updates.communities
      ? params.updates.communities.map((community) => community.trim()).filter(Boolean)
      : contact.communities,
    city: resolveOptional(params.updates.city, contact.city),
    tier: resolveOptional(params.updates.tier, contact.tier),
    introducedBy: resolveOptional(params.updates.introducedBy, contact.introducedBy),
    updatedAt: nowIso(),
  };
  store.contacts.set(updated.id, updated);
  return updated;
}

export function deleteContact(params: {
  contactId: string;
  workspaceId: string;
}): boolean {
  const store = getContactsStore();
  const contact = store.contacts.get(params.contactId);
  if (!contact || contact.workspaceId !== params.workspaceId) {
    return false;
  }
  store.contacts.delete(params.contactId);
  return true;
}

export function getContact(params: {
  contactId: string;
  workspaceId: string;
}): Contact | undefined {
  const store = getContactsStore();
  const contact = store.contacts.get(params.contactId);
  if (!contact || contact.workspaceId !== params.workspaceId) {
    return undefined;
  }
  return contact;
}

export function listContacts(params: ListContactsParams): ListContactsResult {
  const store = getContactsStore();
  const page = params.page && params.page > 0 ? params.page : 1;
  const perPage = params.perPage && params.perPage > 0 ? params.perPage : 20;
  const filters = params.filters ?? {};

  let results = Array.from(store.contacts.values()).filter(
    (contact) => contact.workspaceId === params.workspaceId
  );

  if (filters.tier) {
    const tier = normalizeString(filters.tier);
    results = results.filter((contact) => normalizeString(contact.tier) === tier);
  }
  if (filters.city) {
    const city = normalizeString(filters.city);
    results = results.filter((contact) => normalizeString(contact.city) === city);
  }
  if (filters.tags && filters.tags.length > 0) {
    results = results.filter((contact) => matchesTags(contact, filters.tags ?? []));
  }
  if (filters.organization) {
    const organization = normalizeString(filters.organization);
    results = results.filter((contact) =>
      contact.organizations.some((org) => normalizeString(org) === organization)
    );
  }
  if (filters.community) {
    const community = normalizeString(filters.community);
    results = results.filter((contact) =>
      contact.communities.some((item) => normalizeString(item) === community)
    );
  }
  if (filters.trustScoreMin !== undefined || filters.trustScoreMax !== undefined) {
    results = results.filter((contact) =>
      inRange(contact.trustScore, filters.trustScoreMin, filters.trustScoreMax)
    );
  }

  switch (params.sort) {
    case "trust_score":
      results.sort((a, b) => (b.trustScore ?? 0) - (a.trustScore ?? 0));
      break;
    case "name":
      results.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "last_interaction":
    default:
      results.sort((a, b) =>
        (b.lastInteractionAt ?? "").localeCompare(a.lastInteractionAt ?? "")
      );
  }

  const total = results.length;
  const start = (page - 1) * perPage;
  const end = start + perPage;

  return {
    contacts: results.slice(start, end),
    total,
    page,
    perPage,
  };
}

export function listAllContacts(workspaceId: string): Contact[] {
  const store = getContactsStore();
  return Array.from(store.contacts.values()).filter(
    (contact) => contact.workspaceId === workspaceId
  );
}

export function mergeContacts(params: {
  workspaceId: string;
  survivorId: string;
  sourceIds: string[];
  selections?: ContactMergeSelection;
}): Contact | undefined {
  const store = getContactsStore();
  const { workspaceId, survivorId, selections } = params;
  const sourceIds = params.sourceIds.filter((id) => id !== survivorId);
  if (sourceIds.length === 0) {
    return undefined;
  }

  const survivor = store.contacts.get(survivorId);
  if (!survivor || survivor.workspaceId !== workspaceId) {
    return undefined;
  }

  const sources = sourceIds
    .map((id) => store.contacts.get(id))
    .filter((contact): contact is Contact => Boolean(contact));

  if (sources.length !== sourceIds.length) {
    return undefined;
  }

  if (!sources.every((contact) => contact.workspaceId === workspaceId)) {
    return undefined;
  }

  const contactSnapshot = new Map(store.contacts);
  const relationsSnapshot = snapshotRelations();

  const fieldSource = (field: ContactMergeField): Contact => {
    const selectedId = selections?.[field];
    const selected = selectedId ? store.contacts.get(selectedId) : undefined;
    return selected && selected.workspaceId === workspaceId ? selected : survivor;
  };

  const merged: Contact = {
    ...survivor,
    name: fieldSource("name").name,
    city: fieldSource("city").city,
    tier: fieldSource("tier").tier,
    trustScore: fieldSource("trustScore").trustScore,
    introducedBy: fieldSource("introducedBy").introducedBy,
    aliases: uniqueList([survivor.aliases, ...sources.map((item) => item.aliases)].flat()),
    tags: uniqueList([survivor.tags, ...sources.map((item) => item.tags)].flat()),
    organizations: uniqueList(
      [survivor.organizations, ...sources.map((item) => item.organizations)].flat()
    ),
    communities: uniqueList(
      [survivor.communities, ...sources.map((item) => item.communities)].flat()
    ),
    channels: mergeChannels(
      survivor.channels,
      sources.flatMap((item) => item.channels)
    ),
    notes: [
      ...survivor.notes,
      ...sources.flatMap((item) => item.notes),
    ],
    updatedAt: nowIso(),
  };

  store.contacts.set(survivor.id, merged);
  sources.forEach((contact) => {
    store.contacts.delete(contact.id);
  });
  sources.forEach((contact) => {
    reassignContactRelations({
      workspaceId,
      fromContactId: contact.id,
      toContactId: survivor.id,
    });
  });
  if (!store.contacts.has(survivor.id)) {
    store.contacts = contactSnapshot;
    restoreRelations(relationsSnapshot);
    return undefined;
  }
  return merged;
}

export function filterNotesForRole(contact: Contact, role: string): Contact {
  if (role !== "assistant") {
    return contact;
  }
  return {
    ...contact,
    notes: contact.notes.filter((note) => note.visibility !== "private"),
  };
}
