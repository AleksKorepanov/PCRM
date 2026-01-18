import { randomUUID } from "crypto";

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

export function filterNotesForRole(contact: Contact, role: string): Contact {
  if (role !== "assistant") {
    return contact;
  }
  return {
    ...contact,
    notes: contact.notes.filter((note) => note.visibility !== "private"),
  };
}
