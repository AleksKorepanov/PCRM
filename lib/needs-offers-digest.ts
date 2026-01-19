import { Locale } from "@/lib/text";

export type DigestLocale = Locale;

export type DigestTemplate = {
  header: string;
  footer: string;
};

export type DigestTemplates = Record<DigestLocale, DigestTemplate>;

export type DigestItem = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  geo?: string;
  expiresAt?: string;
  visibility: "private" | "restricted" | "workspace";
  ownerName?: string;
};

export type DigestMatch = {
  id: string;
  needTitle: string;
  offerTitle: string;
  score: number;
  explanation: Record<DigestLocale, string>;
};

export type DigestData = {
  needs: DigestItem[];
  offers: DigestItem[];
  matches: DigestMatch[];
};

const sectionLabels: Record<
  DigestLocale,
  {
    matches: string;
    needs: string;
    offers: string;
    scoreLabel: string;
    expiresLabel: string;
    visibility: Record<DigestItem["visibility"], string>;
    emptyMatches: string;
    emptyNeeds: string;
    emptyOffers: string;
  }
> = {
  ru: {
    matches: "Матчи недели",
    needs: "Открытые потребности",
    offers: "Открытые предложения",
    scoreLabel: "Скор",
    expiresLabel: "Истекает",
    visibility: {
      private: "Приватно",
      restricted: "Ограниченный доступ",
      workspace: "Для пространства",
    },
    emptyMatches: "Пока нет подходящих совпадений.",
    emptyNeeds: "Нет активных запросов.",
    emptyOffers: "Нет активных предложений.",
  },
  en: {
    matches: "Weekly matches",
    needs: "Open needs",
    offers: "Open offers",
    scoreLabel: "Score",
    expiresLabel: "Expires",
    visibility: {
      private: "Private",
      restricted: "Restricted",
      workspace: "Workspace",
    },
    emptyMatches: "No matches this week.",
    emptyNeeds: "No active needs.",
    emptyOffers: "No active offers.",
  },
};

function formatDate(date: string, locale: DigestLocale): string {
  return new Date(date).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatItem(item: DigestItem, locale: DigestLocale): string {
  const labels = sectionLabels[locale];
  const bits = [
    item.description,
    item.geo ? `Geo: ${item.geo}` : undefined,
    item.tags.length ? `#${item.tags.join(" #")}` : undefined,
    item.expiresAt
      ? `${labels.expiresLabel}: ${formatDate(item.expiresAt, locale)}`
      : undefined,
    `(${labels.visibility[item.visibility]})`,
  ].filter(Boolean);

  return `• ${item.title}${item.ownerName ? ` — ${item.ownerName}` : ""}\n  ${bits.join(" | ")}`;
}

function formatMatches(matches: DigestMatch[], locale: DigestLocale): string {
  const labels = sectionLabels[locale];
  if (matches.length === 0) {
    return labels.emptyMatches;
  }
  return matches
    .map((match) =>
      `• ${match.needTitle} ↔ ${match.offerTitle}\n  ${labels.scoreLabel}: ${match.score.toFixed(1)} | ${match.explanation[locale]}`
    )
    .join("\n");
}

function formatItems(items: DigestItem[], locale: DigestLocale, emptyLabel: string): string {
  if (items.length === 0) {
    return emptyLabel;
  }
  return items.map((item) => formatItem(item, locale)).join("\n");
}

export function buildWeeklyDigestText(params: {
  locale: DigestLocale;
  templates: DigestTemplates;
  data: DigestData;
}): string {
  const labels = sectionLabels[params.locale];
  const template = params.templates[params.locale];
  const blocks = [
    template.header.trim(),
    `\n${labels.matches}\n${formatMatches(params.data.matches, params.locale)}`,
    `\n${labels.needs}\n${formatItems(
      params.data.needs,
      params.locale,
      labels.emptyNeeds
    )}`,
    `\n${labels.offers}\n${formatItems(
      params.data.offers,
      params.locale,
      labels.emptyOffers
    )}`,
    template.footer.trim(),
  ];

  return blocks.filter((block) => block.trim()).join("\n\n").trim();
}
