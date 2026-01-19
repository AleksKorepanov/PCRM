import { Card } from "@/components/ui/card";

export type IntroductionCardData = {
  id: string;
  status: "proposed" | "requested" | "accepted" | "declined" | "completed";
  introducerName: string;
  contactAName: string;
  contactBName: string;
  ask: string;
  context?: string;
  consentPolicy: "mutual" | "single";
  consents: Array<{ contactName: string; status: "pending" | "approved" | "declined" }>;
  outcome?: {
    status: "connected" | "scheduled" | "not_a_fit" | "no_response";
    summary?: string;
    loggedAt: string;
  };
};

const statusLabels: Record<
  IntroductionCardData["status"],
  { ru: string; en: string }
> = {
  proposed: { ru: "Черновик", en: "Draft" },
  requested: { ru: "Запрошено", en: "Requested" },
  accepted: { ru: "Согласовано", en: "Accepted" },
  declined: { ru: "Отклонено", en: "Declined" },
  completed: { ru: "Завершено", en: "Completed" },
};

const consentLabels: Record<
  IntroductionCardData["consents"][number]["status"],
  { ru: string; en: string }
> = {
  pending: { ru: "Ожидает", en: "Pending" },
  approved: { ru: "Согласие", en: "Approved" },
  declined: { ru: "Отказ", en: "Declined" },
};

const policyLabels = {
  mutual: { ru: "Нужно согласие обоих", en: "Mutual consent required" },
  single: { ru: "Достаточно одного согласия", en: "Single-side consent" },
};

const outcomeLabels: Record<
  NonNullable<IntroductionCardData["outcome"]>["status"],
  { ru: string; en: string }
> = {
  connected: { ru: "Интро состоялось", en: "Connected" },
  scheduled: { ru: "Запланирована встреча", en: "Scheduled" },
  not_a_fit: { ru: "Не подходит", en: "Not a fit" },
  no_response: { ru: "Нет ответа", en: "No response" },
};

function formatDate(locale: "ru" | "en", value?: string): string {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function IntroductionCard({
  locale,
  introduction,
}: {
  locale: "ru" | "en";
  introduction: IntroductionCardData;
}) {
  const statusLabel = statusLabels[introduction.status][locale];
  const policyLabel = policyLabels[introduction.consentPolicy][locale];
  const askLabel = locale === "ru" ? "Запрос" : "Ask";
  const contextLabel = locale === "ru" ? "Контекст" : "Context";
  const introLabel = locale === "ru" ? "Интро" : "Intro";
  const consentLabel = locale === "ru" ? "Согласия" : "Consents";
  const outcomeLabel = locale === "ru" ? "Результат" : "Outcome";

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-base font-semibold text-slate-900">
            {introduction.contactAName} ↔ {introduction.contactBName}
          </div>
          <div className="text-xs text-slate-500">
            {introLabel}: {introduction.introducerName}
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-600">
          {statusLabel}
        </span>
      </div>
      <div className="space-y-2 text-sm text-slate-600">
        <div>
          <span className="font-medium text-slate-700">{askLabel}:</span> {introduction.ask}
        </div>
        {introduction.context && (
          <div>
            <span className="font-medium text-slate-700">{contextLabel}:</span>{" "}
            {introduction.context}
          </div>
        )}
      </div>
      <div className="space-y-2 text-sm text-slate-600">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {consentLabel}
        </div>
        <div className="text-xs text-slate-500">{policyLabel}</div>
        <div className="space-y-1">
          {introduction.consents.map((consent) => (
            <div key={consent.contactName} className="flex items-center gap-2">
              <span className="text-sm text-slate-700">{consent.contactName}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {consentLabels[consent.status][locale]}
              </span>
            </div>
          ))}
        </div>
      </div>
      {introduction.outcome && (
        <div className="space-y-2 text-sm text-slate-600">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {outcomeLabel}
          </div>
          <div className="text-sm text-slate-700">
            {outcomeLabels[introduction.outcome.status][locale]}
          </div>
          {introduction.outcome.summary && (
            <div className="text-sm text-slate-600">{introduction.outcome.summary}</div>
          )}
          <div className="text-xs text-slate-500">
            {formatDate(locale, introduction.outcome.loggedAt)}
          </div>
        </div>
      )}
    </Card>
  );
}
