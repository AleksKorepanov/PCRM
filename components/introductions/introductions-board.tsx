import { Card } from "@/components/ui/card";
import {
  IntroductionCard,
  IntroductionCardData,
} from "@/components/introductions/intro-card";

const statusOrder: IntroductionCardData["status"][] = [
  "requested",
  "accepted",
  "declined",
  "completed",
  "proposed",
];

const statusHeadings: Record<
  IntroductionCardData["status"],
  { ru: string; en: string }
> = {
  proposed: { ru: "Черновики", en: "Drafts" },
  requested: { ru: "Запрошено", en: "Requested" },
  accepted: { ru: "Согласовано", en: "Accepted" },
  declined: { ru: "Отклонено", en: "Declined" },
  completed: { ru: "Завершено", en: "Completed" },
};

type IntroductionsBoardProps = {
  locale: "ru" | "en";
  introductions: IntroductionCardData[];
};

export function IntroductionsBoard({ locale, introductions }: IntroductionsBoardProps) {
  if (introductions.length === 0) {
    return (
      <Card className="p-6 text-sm text-slate-600">
        {locale === "ru"
          ? "Пока нет запросов на интро."
          : "No introductions have been requested yet."}
      </Card>
    );
  }

  const grouped = statusOrder.map((status) => ({
    status,
    introductions: introductions.filter((intro) => intro.status === status),
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {grouped.map((column) => (
        <Card key={column.status} className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">
              {statusHeadings[column.status][locale]}
            </div>
            <div className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {column.introductions.length}
            </div>
          </div>
          {column.introductions.length === 0 ? (
            <div className="text-xs text-slate-400">
              {locale === "ru" ? "Нет записей" : "No entries"}
            </div>
          ) : (
            <div className="space-y-3">
              {column.introductions.map((introduction) => (
                <IntroductionCard
                  key={introduction.id}
                  locale={locale}
                  introduction={introduction}
                />
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
