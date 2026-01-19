import { Card } from "@/components/ui/card";
import { NeedOfferStatus, NeedOfferType, NeedOfferVisibility } from "@/lib/needs-offers";

export type NeedOfferCardData = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: NeedOfferStatus;
  entryType: NeedOfferType;
  visibility: NeedOfferVisibility;
  geo?: string;
  expiresAt?: string;
  ownerName?: string;
};

const statusLabels: Record<NeedOfferStatus, { ru: string; en: string }> = {
  open: { ru: "Открыто", en: "Open" },
  matched: { ru: "Сматчено", en: "Matched" },
  closed: { ru: "Закрыто", en: "Closed" },
};

const visibilityLabels: Record<NeedOfferVisibility, { ru: string; en: string }> = {
  private: { ru: "Приватно", en: "Private" },
  restricted: { ru: "Ограничено", en: "Restricted" },
  workspace: { ru: "Всем в пространстве", en: "Workspace" },
};

function formatDate(value: string, locale: "ru" | "en"): string {
  return new Date(value).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

export function NeedOfferCard({
  locale,
  entry,
}: {
  locale: "ru" | "en";
  entry: NeedOfferCardData;
}) {
  return (
    <Card key={entry.id} className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">{entry.title}</div>
          <div className="text-xs text-slate-500">
            {entry.ownerName
              ? entry.ownerName
              : entry.entryType === "need"
                ? locale === "ru"
                  ? "Запрос" : "Need"
                : locale === "ru" ? "Предложение" : "Offer"}
          </div>
        </div>
        <div className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {statusLabels[entry.status][locale]}
        </div>
      </div>
      <div className="text-sm text-slate-600">{entry.description}</div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <span>{visibilityLabels[entry.visibility][locale]}</span>
        {entry.geo && <span>Geo: {entry.geo}</span>}
        {entry.expiresAt && (
          <span>
            {locale === "ru" ? "Истекает" : "Expires"}: {formatDate(entry.expiresAt, locale)}
          </span>
        )}
      </div>
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
