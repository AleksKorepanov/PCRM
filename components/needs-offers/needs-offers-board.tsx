import { Card } from "@/components/ui/card";
import { NeedOfferCard, NeedOfferCardData } from "@/components/needs-offers/need-offer-card";

export function NeedsOffersBoard({
  locale,
  needs,
  offers,
}: {
  locale: "ru" | "en";
  needs: NeedOfferCardData[];
  offers: NeedOfferCardData[];
}) {
  const emptyLabel = locale === "ru" ? "Нет записей" : "No entries";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">
            {locale === "ru" ? "Потребности" : "Needs"}
          </div>
          <div className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {needs.length}
          </div>
        </div>
        {needs.length === 0 ? (
          <div className="text-xs text-slate-400">{emptyLabel}</div>
        ) : (
          <div className="space-y-3">
            {needs.map((entry) => (
              <NeedOfferCard key={entry.id} locale={locale} entry={entry} />
            ))}
          </div>
        )}
      </Card>
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">
            {locale === "ru" ? "Предложения" : "Offers"}
          </div>
          <div className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {offers.length}
          </div>
        </div>
        {offers.length === 0 ? (
          <div className="text-xs text-slate-400">{emptyLabel}</div>
        ) : (
          <div className="space-y-3">
            {offers.map((entry) => (
              <NeedOfferCard key={entry.id} locale={locale} entry={entry} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
