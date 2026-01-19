import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NeedOfferMatch } from "@/lib/needs-offers";

export type NeedOfferMatchCard = NeedOfferMatch & {
  needTitle: string;
  offerTitle: string;
};

export function MatchesPanel({
  locale,
  matches,
}: {
  locale: "ru" | "en";
  matches: NeedOfferMatchCard[];
}) {
  if (matches.length === 0) {
    return (
      <Card className="p-6 text-sm text-slate-600">
        {locale === "ru"
          ? "Матчи пока не найдены."
          : "No matches have been found yet."}
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {matches.map((match) => (
        <Card key={match.id} className="space-y-3">
          <div className="text-sm font-semibold text-slate-900">
            {match.needTitle} ↔ {match.offerTitle}
          </div>
          <div className="text-xs text-slate-500">
            {locale === "ru" ? "Скор" : "Score"}: {match.score.toFixed(1)}
          </div>
          <div className="text-sm text-slate-600">{match.explanation[locale]}</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary">
              {locale === "ru" ? "Создать интро" : "Create intro"}
            </Button>
            <Button variant="ghost">
              {locale === "ru" ? "Отметить как матч" : "Mark as matched"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
