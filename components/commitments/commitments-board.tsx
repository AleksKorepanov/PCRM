import { Card } from "@/components/ui/card";
import { CommitmentCard, CommitmentCardData } from "@/components/commitments/commitment-card";

const statusOrder: CommitmentCardData["status"][] = [
  "open",
  "in_progress",
  "fulfilled",
  "broken",
  "canceled",
];

const statusHeadings: Record<CommitmentCardData["status"], { ru: string; en: string }> = {
  open: { ru: "Открыто", en: "Open" },
  in_progress: { ru: "В работе", en: "In progress" },
  fulfilled: { ru: "Выполнено", en: "Fulfilled" },
  broken: { ru: "Нарушено", en: "Broken" },
  canceled: { ru: "Отменено", en: "Canceled" },
};

type CommitmentsBoardProps = {
  locale: "ru" | "en";
  commitments: CommitmentCardData[];
};

export function CommitmentsBoard({ locale, commitments }: CommitmentsBoardProps) {
  if (commitments.length === 0) {
    return (
      <Card className="p-6 text-sm text-slate-600">
        {locale === "ru"
          ? "Пока нет зафиксированных обязательств."
          : "No commitments have been logged yet."}
      </Card>
    );
  }

  const grouped = statusOrder.map((status) => ({
    status,
    commitments: commitments.filter((commitment) => commitment.status === status),
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
              {column.commitments.length}
            </div>
          </div>
          {column.commitments.length === 0 ? (
            <div className="text-xs text-slate-400">
              {locale === "ru" ? "Нет записей" : "No entries"}
            </div>
          ) : (
            <div className="space-y-3">
              {column.commitments.map((commitment) => (
                <CommitmentCard
                  key={commitment.id}
                  locale={locale}
                  commitment={commitment}
                />
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
