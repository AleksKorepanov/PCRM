import { randomUUID } from "crypto";

import { createInteraction } from "@/lib/interactions";
import { createRelationshipEdge, listRelations } from "@/lib/relations";
import { Locale } from "@/lib/text";

export type IntroductionStatus =
  | "proposed"
  | "requested"
  | "accepted"
  | "declined"
  | "completed";

export type IntroductionConsentStatus = "pending" | "approved" | "declined";

export type IntroductionConsentPolicy = "mutual" | "single";

export type IntroductionOutcomeStatus =
  | "connected"
  | "scheduled"
  | "not_a_fit"
  | "no_response";

export type IntroductionOutcome = {
  status: IntroductionOutcomeStatus;
  summary?: string;
  loggedAt: string;
};

export type Introduction = {
  id: string;
  workspaceId: string;
  introducerContactId: string;
  contactAId: string;
  contactBId: string;
  ask: string;
  context?: string;
  status: IntroductionStatus;
  consentPolicy: IntroductionConsentPolicy;
  outcome?: IntroductionOutcome;
  createdAt: string;
  updatedAt: string;
};

export type IntroductionConsent = {
  id: string;
  workspaceId: string;
  introductionId: string;
  contactId: string;
  status: IntroductionConsentStatus;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type IntroductionTemplateTokens = {
  introducerName: string;
  contactAName: string;
  contactBName: string;
  ask: string;
  context?: string;
  outcome?: string;
};

export type IntroductionMessageTemplates = {
  requestSubject: string;
  requestBody: string;
  consentBody: string;
  outcomeBody: string;
};

export type IntroductionTemplates = Record<Locale, IntroductionMessageTemplates>;

export type IntroductionWithConsents = Introduction & {
  consents: IntroductionConsent[];
};

type IntroductionsStore = {
  introductions: Map<string, Introduction>;
  consents: Map<string, IntroductionConsent>;
  templates: Map<string, IntroductionTemplates>;
};

export type IntroductionsSnapshot = {
  introductions: Introduction[];
  consents: IntroductionConsent[];
  templates: Array<[string, IntroductionTemplates]>;
};

const introductionsKey = Symbol.for("pcrm.introductions");

const defaultTemplates: IntroductionTemplates = {
  ru: {
    requestSubject: "Интро: {{contactA}} ↔ {{contactB}}",
    requestBody:
      "{{introducer}} хочет познакомить {{contactA}} и {{contactB}}. Запрос: {{ask}}\nКонтекст: {{context}}",
    consentBody:
      "Подтвердите согласие на интро между {{contactA}} и {{contactB}}. Можно отвечать прямо в этом треде.",
    outcomeBody:
      "Итог интро: {{outcome}}. Следующий шаг: {{ask}}",
  },
  en: {
    requestSubject: "Intro: {{contactA}} ↔ {{contactB}}",
    requestBody:
      "{{introducer}} would like to introduce {{contactA}} and {{contactB}}. Ask: {{ask}}\nContext: {{context}}",
    consentBody:
      "Please confirm consent for the intro between {{contactA}} and {{contactB}}. Reply in this thread.",
    outcomeBody: "Intro outcome: {{outcome}}. Next step: {{ask}}",
  },
};

function nowIso(): string {
  return new Date().toISOString();
}

function getIntroductionsStore(): IntroductionsStore {
  const globalStore = globalThis as unknown as Record<
    string | symbol,
    IntroductionsStore | undefined
  >;
  if (!globalStore[introductionsKey]) {
    globalStore[introductionsKey] = {
      introductions: new Map(),
      consents: new Map(),
      templates: new Map(),
    };
  }
  return globalStore[introductionsKey]!;
}

export function resetIntroductionsStore(): void {
  const store = getIntroductionsStore();
  store.introductions = new Map();
  store.consents = new Map();
  store.templates = new Map();
}

function normalizeText(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function createIntroductionConsent(params: {
  workspaceId: string;
  introductionId: string;
  contactId: string;
  status?: IntroductionConsentStatus;
}): IntroductionConsent {
  const store = getIntroductionsStore();
  const createdAt = nowIso();
  const consent: IntroductionConsent = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    introductionId: params.introductionId,
    contactId: params.contactId,
    status: params.status ?? "pending",
    createdAt,
    updatedAt: createdAt,
  };
  store.consents.set(consent.id, consent);
  return consent;
}

function resolveIntroductionStatus(params: {
  introduction: Introduction;
  consents: IntroductionConsent[];
}): IntroductionStatus {
  const { introduction, consents } = params;
  if (introduction.status === "completed") {
    return "completed";
  }
  if (consents.some((consent) => consent.status === "declined")) {
    return "declined";
  }
  const approvals = consents.filter((consent) => consent.status === "approved").length;
  const hasAnyApproval = approvals > 0;
  const hasAllApprovals = approvals === consents.length && consents.length > 0;
  if (introduction.consentPolicy === "mutual") {
    return hasAllApprovals ? "accepted" : "requested";
  }
  return hasAnyApproval ? "accepted" : "requested";
}

function updateIntroduction(introduction: Introduction): Introduction {
  const store = getIntroductionsStore();
  store.introductions.set(introduction.id, introduction);
  return introduction;
}

function canUpdateConsent(introduction: Introduction, contactId: string): boolean {
  return (
    introduction.contactAId === contactId || introduction.contactBId === contactId
  );
}

export function createIntroduction(params: {
  workspaceId: string;
  introducerContactId: string;
  contactAId: string;
  contactBId: string;
  ask: string;
  context?: string;
  status?: IntroductionStatus;
  consentPolicy?: IntroductionConsentPolicy;
  consents?: Array<{ contactId: string; status?: IntroductionConsentStatus }>;
}): IntroductionWithConsents {
  const store = getIntroductionsStore();
  const createdAt = nowIso();
  const introduction: Introduction = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    introducerContactId: params.introducerContactId,
    contactAId: params.contactAId,
    contactBId: params.contactBId,
    ask: params.ask.trim(),
    context: normalizeText(params.context),
    status: params.status ?? "requested",
    consentPolicy: params.consentPolicy ?? "mutual",
    createdAt,
    updatedAt: createdAt,
  };
  store.introductions.set(introduction.id, introduction);

  const consents = params.consents?.length
    ? params.consents.map((consent) =>
        createIntroductionConsent({
          workspaceId: params.workspaceId,
          introductionId: introduction.id,
          contactId: consent.contactId,
          status: consent.status,
        })
      )
    : [
        createIntroductionConsent({
          workspaceId: params.workspaceId,
          introductionId: introduction.id,
          contactId: params.contactAId,
        }),
        createIntroductionConsent({
          workspaceId: params.workspaceId,
          introductionId: introduction.id,
          contactId: params.contactBId,
        }),
      ];

  return { ...introduction, consents };
}

export function getIntroduction(params: {
  workspaceId: string;
  introductionId: string;
}): IntroductionWithConsents | undefined {
  const store = getIntroductionsStore();
  const introduction = store.introductions.get(params.introductionId);
  if (!introduction || introduction.workspaceId !== params.workspaceId) {
    return undefined;
  }
  const consents = Array.from(store.consents.values()).filter(
    (consent) =>
      consent.workspaceId === params.workspaceId &&
      consent.introductionId === params.introductionId
  );
  return { ...introduction, consents };
}

export function listIntroductions(params: {
  workspaceId: string;
}): IntroductionWithConsents[] {
  const store = getIntroductionsStore();
  const consents = Array.from(store.consents.values()).filter(
    (consent) => consent.workspaceId === params.workspaceId
  );
  return Array.from(store.introductions.values())
    .filter((intro) => intro.workspaceId === params.workspaceId)
    .map((intro) => ({
      ...intro,
      consents: consents.filter((consent) => consent.introductionId === intro.id),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function updateIntroductionConsent(params: {
  workspaceId: string;
  introductionId: string;
  contactId: string;
  status: IntroductionConsentStatus;
}): IntroductionWithConsents | undefined {
  const store = getIntroductionsStore();
  const intro = store.introductions.get(params.introductionId);
  if (!intro || intro.workspaceId !== params.workspaceId) {
    return undefined;
  }
  if (!canUpdateConsent(intro, params.contactId)) {
    return undefined;
  }

  const existing = Array.from(store.consents.values()).find(
    (consent) =>
      consent.workspaceId === params.workspaceId &&
      consent.introductionId === params.introductionId &&
      consent.contactId === params.contactId
  );
  const decidedAt = nowIso();
  if (existing) {
    const updated = {
      ...existing,
      status: params.status,
      decidedAt,
      updatedAt: decidedAt,
    };
    store.consents.set(existing.id, updated);
  } else {
    createIntroductionConsent({
      workspaceId: params.workspaceId,
      introductionId: params.introductionId,
      contactId: params.contactId,
      status: params.status,
    });
  }

  const consents = Array.from(store.consents.values()).filter(
    (consent) =>
      consent.workspaceId === params.workspaceId &&
      consent.introductionId === params.introductionId
  );
  const status = resolveIntroductionStatus({ introduction: intro, consents });
  const updatedIntro = updateIntroduction({
    ...intro,
    status,
    updatedAt: decidedAt,
  });
  return { ...updatedIntro, consents };
}

export function updateIntroductionPolicy(params: {
  workspaceId: string;
  introductionId: string;
  consentPolicy: IntroductionConsentPolicy;
}): IntroductionWithConsents | undefined {
  const store = getIntroductionsStore();
  const intro = store.introductions.get(params.introductionId);
  if (!intro || intro.workspaceId !== params.workspaceId) {
    return undefined;
  }
  const consents = Array.from(store.consents.values()).filter(
    (consent) =>
      consent.workspaceId === params.workspaceId &&
      consent.introductionId === params.introductionId
  );
  const updated = updateIntroduction({
    ...intro,
    consentPolicy: params.consentPolicy,
    status: resolveIntroductionStatus({ introduction: intro, consents }),
    updatedAt: nowIso(),
  });
  return { ...updated, consents };
}

export function recordIntroductionOutcome(params: {
  workspaceId: string;
  introductionId: string;
  status: IntroductionOutcomeStatus;
  summary?: string;
}): IntroductionWithConsents | undefined {
  const store = getIntroductionsStore();
  const intro = store.introductions.get(params.introductionId);
  if (!intro || intro.workspaceId !== params.workspaceId) {
    return undefined;
  }

  const loggedAt = nowIso();
  const outcome: IntroductionOutcome = {
    status: params.status,
    summary: normalizeText(params.summary),
    loggedAt,
  };
  const status =
    params.status === "connected" || params.status === "scheduled"
      ? "completed"
      : "declined";
  const updated = updateIntroduction({
    ...intro,
    status,
    outcome,
    updatedAt: loggedAt,
  });

  createInteraction({
    workspaceId: params.workspaceId,
    subject: "Intro outcome",
    summary: [
      "[intro]",
      `status=${params.status}`,
      intro.ask ? `ask=${intro.ask}` : undefined,
      intro.context ? `context=${intro.context}` : undefined,
      outcome.summary ? `notes=${outcome.summary}` : undefined,
    ]
      .filter(Boolean)
      .join(" | "),
    interactionType: "event",
    occurredAt: loggedAt,
    privacyLevel: "workspace",
    participants: [
      { contactId: intro.introducerContactId, role: "introducer" },
      { contactId: intro.contactAId, role: "contact_a" },
      { contactId: intro.contactBId, role: "contact_b" },
    ],
  });

  if (params.status === "connected") {
    const existing = listRelations(params.workspaceId).relationshipEdges;
    const hasEdge = (fromId: string, toId: string) =>
      existing.some(
        (edge) => edge.fromContactId === fromId && edge.toContactId === toId
      );
    if (!hasEdge(intro.contactAId, intro.contactBId)) {
      createRelationshipEdge({
        workspaceId: params.workspaceId,
        fromContactId: intro.contactAId,
        toContactId: intro.contactBId,
        introducedByContactId: intro.introducerContactId,
      });
    }
    if (!hasEdge(intro.contactBId, intro.contactAId)) {
      createRelationshipEdge({
        workspaceId: params.workspaceId,
        fromContactId: intro.contactBId,
        toContactId: intro.contactAId,
        introducedByContactId: intro.introducerContactId,
      });
    }
  }

  const consents = Array.from(store.consents.values()).filter(
    (consent) =>
      consent.workspaceId === params.workspaceId &&
      consent.introductionId === params.introductionId
  );

  return { ...updated, consents };
}

export function getIntroductionTemplates(workspaceId: string): IntroductionTemplates {
  const store = getIntroductionsStore();
  const existing = store.templates.get(workspaceId);
  return existing ?? { ...defaultTemplates };
}

export function updateIntroductionTemplates(params: {
  workspaceId: string;
  templates: IntroductionTemplates;
}): IntroductionTemplates {
  const store = getIntroductionsStore();
  store.templates.set(params.workspaceId, params.templates);
  return params.templates;
}

export function buildIntroductionTemplatePreview(params: {
  locale: Locale;
  templates: IntroductionTemplates;
  tokens: IntroductionTemplateTokens;
}): string {
  const template = params.templates[params.locale];
  const tokenValues = {
    introducer: params.tokens.introducerName,
    contactA: params.tokens.contactAName,
    contactB: params.tokens.contactBName,
    ask: params.tokens.ask,
    context: params.tokens.context ?? "",
    outcome: params.tokens.outcome ?? "",
  };

  const replaceTokens = (value: string) =>
    Object.entries(tokenValues).reduce(
      (acc, [key, replacement]) => acc.replaceAll(`{{${key}}}`, replacement),
      value
    );

  const sections = [
    `${replaceTokens(template.requestSubject)}`,
    replaceTokens(template.requestBody),
    replaceTokens(template.consentBody),
    replaceTokens(template.outcomeBody),
  ];

  return sections.filter((section) => section.trim()).join("\n\n");
}

export function snapshotIntroductions(): IntroductionsSnapshot {
  const store = getIntroductionsStore();
  return {
    introductions: [...store.introductions.values()],
    consents: [...store.consents.values()],
    templates: [...store.templates.entries()],
  };
}

export function restoreIntroductions(snapshot: IntroductionsSnapshot): void {
  const store = getIntroductionsStore();
  store.introductions = new Map(snapshot.introductions.map((intro) => [intro.id, intro]));
  store.consents = new Map(snapshot.consents.map((consent) => [consent.id, consent]));
  store.templates = new Map(snapshot.templates);
}
