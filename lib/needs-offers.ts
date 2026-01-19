import { randomUUID } from "crypto";

import {
  buildWeeklyDigestText,
  DigestData,
  DigestItem,
  DigestMatch,
  DigestTemplates,
} from "@/lib/needs-offers-digest";
import { canManageNeedsOffers, roleAtLeast } from "@/lib/rbac";
import { Locale } from "@/lib/text";
import { Role } from "@/lib/store";

export type NeedOfferType = "need" | "offer";

export type NeedOfferStatus = "open" | "matched" | "closed";

export type NeedOfferVisibility = "private" | "restricted" | "workspace";

export type NeedOfferGeo = {
  mode: "remote" | "local";
  country?: string;
  city?: string;
};

export type NeedOffer = {
  id: string;
  workspaceId: string;
  ownerUserId: string;
  contactId?: string;
  entryType: NeedOfferType;
  title: string;
  description: string;
  tags: string[];
  status: NeedOfferStatus;
  visibility: NeedOfferVisibility;
  geo?: NeedOfferGeo;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type MatchReason =
  | "tag_overlap"
  | "keyword_overlap"
  | "geo_same_city"
  | "geo_same_country"
  | "geo_remote";

export type NeedOfferMatch = {
  id: string;
  workspaceId: string;
  needId: string;
  offerId: string;
  score: number;
  reasons: MatchReason[];
  details: {
    sharedTags: string[];
    sharedKeywords: string[];
    geo?: string;
  };
  explanation: Record<Locale, string>;
  createdAt: string;
};

export type NeedOfferViewer = {
  userId: string;
  role: Role;
};

export type NeedOfferSnapshot = {
  needsOffers: NeedOffer[];
  matches: NeedOfferMatch[];
  templates: DigestTemplates;
};

type NeedOffersStore = {
  needsOffers: Map<string, NeedOffer>;
  matches: Map<string, NeedOfferMatch>;
  templates: Map<string, DigestTemplates>;
};

const needsOffersKey = Symbol.for("pcrm.needsOffers");

const defaultTemplates: DigestTemplates = {
  ru: {
    header: "Еженедельный дайджест Needs/Offers",
    footer: "Если есть вопросы — ответьте на это сообщение.",
  },
  en: {
    header: "Weekly Needs/Offers digest",
    footer: "Reply to this message if you have questions.",
  },
};

function nowIso(): string {
  return new Date().toISOString();
}

function getNeedsOffersStore(): NeedOffersStore {
  const globalStore = globalThis as unknown as Record<
    string | symbol,
    NeedOffersStore | undefined
  >;
  if (!globalStore[needsOffersKey]) {
    globalStore[needsOffersKey] = {
      needsOffers: new Map(),
      matches: new Map(),
      templates: new Map(),
    };
  }
  return globalStore[needsOffersKey]!;
}

export function resetNeedsOffersStore(): void {
  const store = getNeedsOffersStore();
  store.needsOffers = new Map();
  store.matches = new Map();
  store.templates = new Map();
}

function normalizeText(value?: string): string {
  return value?.trim() ?? "";
}

function normalizeTags(tags?: string[]): string[] {
  return (tags ?? [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .map((tag) => tag.toLowerCase());
}

function normalizeOptional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function isNeedOfferExpired(entry: NeedOffer): boolean {
  if (!entry.expiresAt) {
    return false;
  }
  return new Date(entry.expiresAt).getTime() <= Date.now();
}

export function isNeedOfferVisible(entry: NeedOffer, viewer: NeedOfferViewer): boolean {
  if (entry.visibility === "workspace") {
    return true;
  }
  if (entry.visibility === "restricted") {
    return roleAtLeast(viewer.role, "assistant");
  }
  return entry.ownerUserId === viewer.userId;
}

export function createNeedOffer(params: {
  workspaceId: string;
  ownerUserId: string;
  contactId?: string;
  entryType: NeedOfferType;
  title: string;
  description: string;
  tags?: string[];
  status?: NeedOfferStatus;
  visibility?: NeedOfferVisibility;
  geo?: NeedOfferGeo;
  expiresAt?: string;
}): NeedOffer {
  const store = getNeedsOffersStore();
  const createdAt = nowIso();
  const entry: NeedOffer = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    ownerUserId: params.ownerUserId,
    contactId: params.contactId,
    entryType: params.entryType,
    title: normalizeText(params.title),
    description: normalizeText(params.description),
    tags: normalizeTags(params.tags),
    status: params.status ?? "open",
    visibility: params.visibility ?? "workspace",
    geo: params.geo,
    expiresAt: normalizeOptional(params.expiresAt),
    createdAt,
    updatedAt: createdAt,
  };
  store.needsOffers.set(entry.id, entry);
  return entry;
}

export function createNeedOfferWithRole(params: {
  role: Role;
  workspaceId: string;
  ownerUserId: string;
  contactId?: string;
  entryType: NeedOfferType;
  title: string;
  description: string;
  tags?: string[];
  status?: NeedOfferStatus;
  visibility?: NeedOfferVisibility;
  geo?: NeedOfferGeo;
  expiresAt?: string;
}): NeedOffer | undefined {
  if (!canManageNeedsOffers(params.role)) {
    return undefined;
  }
  return createNeedOffer(params);
}

export function updateNeedOffer(params: {
  workspaceId: string;
  entryId: string;
  updates: Partial<
    Omit<NeedOffer, "id" | "workspaceId" | "ownerUserId" | "createdAt" | "updatedAt">
  >;
}): NeedOffer | undefined {
  const store = getNeedsOffersStore();
  const existing = store.needsOffers.get(params.entryId);
  if (!existing || existing.workspaceId !== params.workspaceId) {
    return undefined;
  }
  const updated: NeedOffer = {
    ...existing,
    contactId: params.updates.contactId ?? existing.contactId,
    entryType: params.updates.entryType ?? existing.entryType,
    title: params.updates.title ? normalizeText(params.updates.title) : existing.title,
    description: params.updates.description
      ? normalizeText(params.updates.description)
      : existing.description,
    tags: params.updates.tags ? normalizeTags(params.updates.tags) : existing.tags,
    status: params.updates.status ?? existing.status,
    visibility: params.updates.visibility ?? existing.visibility,
    geo: params.updates.geo ?? existing.geo,
    expiresAt:
      params.updates.expiresAt !== undefined
        ? normalizeOptional(params.updates.expiresAt)
        : existing.expiresAt,
    updatedAt: nowIso(),
  };
  store.needsOffers.set(updated.id, updated);
  return updated;
}

export function updateNeedOfferWithRole(params: {
  role: Role;
  workspaceId: string;
  entryId: string;
  updates: Partial<
    Omit<NeedOffer, "id" | "workspaceId" | "ownerUserId" | "createdAt" | "updatedAt">
  >;
}): NeedOffer | undefined {
  if (!canManageNeedsOffers(params.role)) {
    return undefined;
  }
  return updateNeedOffer(params);
}

export function deleteNeedOffer(params: {
  workspaceId: string;
  entryId: string;
}): boolean {
  const store = getNeedsOffersStore();
  const existing = store.needsOffers.get(params.entryId);
  if (!existing || existing.workspaceId !== params.workspaceId) {
    return false;
  }
  store.needsOffers.delete(params.entryId);
  return true;
}

export function deleteNeedOfferWithRole(params: {
  role: Role;
  workspaceId: string;
  entryId: string;
}): boolean {
  if (!canManageNeedsOffers(params.role)) {
    return false;
  }
  return deleteNeedOffer(params);
}

export function getNeedOffer(params: {
  workspaceId: string;
  entryId: string;
}): NeedOffer | undefined {
  const store = getNeedsOffersStore();
  const entry = store.needsOffers.get(params.entryId);
  if (!entry || entry.workspaceId !== params.workspaceId) {
    return undefined;
  }
  return entry;
}

export function listNeedOffers(params: {
  workspaceId: string;
  viewer?: NeedOfferViewer;
  entryType?: NeedOfferType;
  status?: NeedOfferStatus | NeedOfferStatus[];
  includeExpired?: boolean;
}): NeedOffer[] {
  const store = getNeedsOffersStore();
  const statuses = Array.isArray(params.status) ? params.status : [params.status];
  const validStatuses = statuses.filter(Boolean) as NeedOfferStatus[];

  let entries = Array.from(store.needsOffers.values()).filter(
    (entry) => entry.workspaceId === params.workspaceId
  );

  if (params.entryType) {
    entries = entries.filter((entry) => entry.entryType === params.entryType);
  }

  if (validStatuses.length > 0) {
    entries = entries.filter((entry) => validStatuses.includes(entry.status));
  }

  if (!params.includeExpired) {
    entries = entries.filter((entry) => !isNeedOfferExpired(entry));
  }

  if (params.viewer) {
    entries = entries.filter((entry) => isNeedOfferVisible(entry, params.viewer!));
  }

  return entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function tokenize(value: string): string[] {
  const tokens = value
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu);
  if (!tokens) {
    return [];
  }
  return tokens.filter((token) => token.length > 2);
}

function intersect(a: string[], b: string[]): string[] {
  const setB = new Set(b);
  return Array.from(new Set(a.filter((item) => setB.has(item)))).sort();
}

function resolveGeoCompatibility(need?: NeedOfferGeo, offer?: NeedOfferGeo): {
  compatible: boolean;
  reason?: MatchReason;
  label?: string;
} {
  if (!need && !offer) {
    return { compatible: true };
  }
  if (need?.mode === "remote" || offer?.mode === "remote") {
    return { compatible: true, reason: "geo_remote", label: "remote" };
  }
  const needCountry = need?.country?.toLowerCase();
  const offerCountry = offer?.country?.toLowerCase();
  if (needCountry && offerCountry && needCountry !== offerCountry) {
    return { compatible: false };
  }
  const needCity = need?.city?.toLowerCase();
  const offerCity = offer?.city?.toLowerCase();
  if (needCity && offerCity && needCity === offerCity) {
    return {
      compatible: true,
      reason: "geo_same_city",
      label: need?.city ?? offer?.city,
    };
  }
  if (needCountry || offerCountry) {
    return {
      compatible: true,
      reason: "geo_same_country",
      label: need?.country ?? offer?.country,
    };
  }
  return { compatible: true };
}

function buildMatchExplanation(params: {
  locale: Locale;
  reasons: MatchReason[];
  details: NeedOfferMatch["details"];
}): string {
  const segments: string[] = [];
  const { locale, reasons, details } = params;

  if (reasons.includes("tag_overlap") && details.sharedTags.length > 0) {
    segments.push(
      locale === "ru"
        ? `Общие теги: ${details.sharedTags.join(", ")}`
        : `Shared tags: ${details.sharedTags.join(", ")}`
    );
  }
  if (reasons.includes("keyword_overlap") && details.sharedKeywords.length > 0) {
    segments.push(
      locale === "ru"
        ? `Ключевые слова: ${details.sharedKeywords.join(", ")}`
        : `Keywords: ${details.sharedKeywords.join(", ")}`
    );
  }
  if (reasons.includes("geo_same_city")) {
    segments.push(
      locale === "ru"
        ? `Одинаковый город: ${details.geo ?? ""}`
        : `Same city: ${details.geo ?? ""}`
    );
  }
  if (reasons.includes("geo_same_country")) {
    segments.push(
      locale === "ru"
        ? `Одна страна: ${details.geo ?? ""}`
        : `Same country: ${details.geo ?? ""}`
    );
  }
  if (reasons.includes("geo_remote")) {
    segments.push(locale === "ru" ? "Удаленный формат" : "Remote-friendly");
  }

  return segments.join(". ");
}

function computeMatchScore(need: NeedOffer, offer: NeedOffer): {
  score: number;
  reasons: MatchReason[];
  details: NeedOfferMatch["details"];
} {
  const sharedTags = intersect(need.tags, offer.tags);
  const sharedKeywords = intersect(tokenize(need.description), tokenize(offer.description));
  const geo = resolveGeoCompatibility(need.geo, offer.geo);

  if (!geo.compatible) {
    return { score: 0, reasons: [], details: { sharedTags: [], sharedKeywords: [] } };
  }

  let score = 0;
  const reasons: MatchReason[] = [];

  if (sharedTags.length > 0) {
    score += sharedTags.length * 25;
    reasons.push("tag_overlap");
  }
  if (sharedKeywords.length > 0) {
    score += sharedKeywords.length * 10;
    reasons.push("keyword_overlap");
  }

  if (geo.reason === "geo_same_city") {
    score += 20;
    reasons.push("geo_same_city");
  } else if (geo.reason === "geo_same_country") {
    score += 12;
    reasons.push("geo_same_country");
  } else if (geo.reason === "geo_remote") {
    score += 6;
    reasons.push("geo_remote");
  }

  return {
    score,
    reasons,
    details: {
      sharedTags,
      sharedKeywords,
      geo: geo.label,
    },
  };
}

function isMatchCandidate(entry: NeedOffer): boolean {
  return entry.status === "open" && !isNeedOfferExpired(entry);
}

export function refreshNeedOfferMatches(params: {
  workspaceId: string;
}): NeedOfferMatch[] {
  const store = getNeedsOffersStore();
  const entries = listNeedOffers({
    workspaceId: params.workspaceId,
    includeExpired: false,
  });
  const needs = entries.filter((entry) => entry.entryType === "need" && isMatchCandidate(entry));
  const offers = entries.filter(
    (entry) => entry.entryType === "offer" && isMatchCandidate(entry)
  );

  store.matches = new Map();

  const matches: NeedOfferMatch[] = [];

  needs.forEach((need) => {
    offers.forEach((offer) => {
      const { score, reasons, details } = computeMatchScore(need, offer);
      if (score <= 0) {
        return;
      }
      const explanation = {
        ru: buildMatchExplanation({ locale: "ru", reasons, details }),
        en: buildMatchExplanation({ locale: "en", reasons, details }),
      };
      const match: NeedOfferMatch = {
        id: randomUUID(),
        workspaceId: params.workspaceId,
        needId: need.id,
        offerId: offer.id,
        score,
        reasons,
        details,
        explanation,
        createdAt: nowIso(),
      };
      store.matches.set(match.id, match);
      matches.push(match);
    });
  });

  return matches.sort((a, b) => b.score - a.score);
}

export function listNeedOfferMatches(params: {
  workspaceId: string;
  viewer: NeedOfferViewer;
}): NeedOfferMatch[] {
  const store = getNeedsOffersStore();
  const entries = new Map(
    listNeedOffers({
      workspaceId: params.workspaceId,
      viewer: params.viewer,
      includeExpired: false,
    }).map((entry) => [entry.id, entry])
  );

  return Array.from(store.matches.values())
    .filter((match) => match.workspaceId === params.workspaceId)
    .filter((match) => entries.has(match.needId) && entries.has(match.offerId))
    .sort((a, b) => b.score - a.score);
}

export function getDigestTemplates(workspaceId: string): DigestTemplates {
  const store = getNeedsOffersStore();
  const existing = store.templates.get(workspaceId);
  return existing ?? { ...defaultTemplates };
}

export function updateDigestTemplates(params: {
  workspaceId: string;
  templates: DigestTemplates;
}): DigestTemplates {
  const store = getNeedsOffersStore();
  store.templates.set(params.workspaceId, params.templates);
  return params.templates;
}

export function buildDigestData(params: {
  workspaceId: string;
  viewer: NeedOfferViewer;
  contactNames: Record<string, string>;
}): DigestData {
  const needs = listNeedOffers({
    workspaceId: params.workspaceId,
    viewer: params.viewer,
    entryType: "need",
  });
  const offers = listNeedOffers({
    workspaceId: params.workspaceId,
    viewer: params.viewer,
    entryType: "offer",
  });
  const matches = listNeedOfferMatches({
    workspaceId: params.workspaceId,
    viewer: params.viewer,
  });

  const needMap = new Map(needs.map((entry) => [entry.id, entry]));
  const offerMap = new Map(offers.map((entry) => [entry.id, entry]));

  const toDigestItem = (entry: NeedOffer): DigestItem => ({
    id: entry.id,
    title: entry.title,
    description: entry.description,
    tags: entry.tags,
    geo: formatNeedOfferGeo(entry),
    expiresAt: entry.expiresAt,
    visibility: entry.visibility,
    ownerName: entry.contactId ? params.contactNames[entry.contactId] : undefined,
  });

  const toDigestMatch = (match: NeedOfferMatch): DigestMatch => {
    const need = needMap.get(match.needId);
    const offer = offerMap.get(match.offerId);
    return {
      id: match.id,
      needTitle: need ? need.title : "",
      offerTitle: offer ? offer.title : "",
      score: match.score,
      explanation: match.explanation,
    };
  };

  return {
    needs: needs.map(toDigestItem),
    offers: offers.map(toDigestItem),
    matches: matches.map(toDigestMatch).filter((match) => match.needTitle && match.offerTitle),
  };
}

export function formatNeedOfferGeo(entry: NeedOffer): string | undefined {
  if (!entry.geo) {
    return undefined;
  }
  if (entry.geo.mode === "remote") {
    return "remote";
  }
  const city = entry.geo.city?.trim();
  const country = entry.geo.country?.trim();
  if (city && country) {
    return `${city}, ${country}`;
  }
  return city ?? country;
}

export function buildWeeklyDigest(params: {
  workspaceId: string;
  viewer: NeedOfferViewer;
  locale: Locale;
  contactNames: Record<string, string>;
}): string {
  const templates = getDigestTemplates(params.workspaceId);
  const data = buildDigestData({
    workspaceId: params.workspaceId,
    viewer: params.viewer,
    contactNames: params.contactNames,
  });
  return buildWeeklyDigestText({
    locale: params.locale,
    templates,
    data,
  });
}

export function snapshotNeedsOffers(): NeedOfferSnapshot {
  const store = getNeedsOffersStore();
  return {
    needsOffers: Array.from(store.needsOffers.values()),
    matches: Array.from(store.matches.values()),
    templates: getDigestTemplates(""),
  };
}
