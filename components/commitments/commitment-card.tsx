"use client";

type CommitmentCardData = {
  id: string;
  title: string;
  description?: string;
  status: "open" | "in_progress" | "fulfilled" | "broken" | "canceled";
  dueAt?: string;
  closedAt?: string;
  isOverdue: boolean;
  owedBy: string[];
  owesTo: string[];
  observers: string[];
};

type CommitmentCardProps = {
  locale: "ru" | "en";
  commitment: CommitmentCardData;
};

const statusLabels: Record<CommitmentCardData["status"], { ru: string; en: string }> = {
  open: { ru: "Открыто", en: "Open" },
  in_progress: { ru: "В работе", en: "In progress" },
  fulfilled: { ru: "Выполнено", en: "Fulfilled" },
  broken: { ru: "Нарушено", en: "Broken" },
  canceled: { ru: "Отменено", en: "Canceled" },
};

const roleLabels = {
  owed_by: { ru: "Должен", en: "Owed by" },
  owes_to: { ru: "Кому", en: "Owes to" },
  observer: { ru: "Наблюдатель", en: "Observer" },
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

export function CommitmentCard({ locale, commitment }: CommitmentCardProps) {
  const statusLabel = statusLabels[commitment.status][locale];
  const overdueLabel = locale === "ru" ? "Просрочено" : "Overdue";
  const dueLabel = locale === "ru" ? "Срок" : "Due";
  const closedLabel = locale === "ru" ? "Закрыто" : "Closed";
  const partiesLabel = locale === "ru" ? "Участники" : "Parties";

  const roles = [
    { key: "owed_by" as const, values: commitment.owedBy },
    { key: "owes_to" as const, values: commitment.owesTo },
    { key: "observer" as const, values: commitment.observers },
  ].filter((entry) => entry.values.length > 0);

  return (
    <div
      className={`rounded-lg border p-4 shadow-sm transition-colors ${
        commitment.isOverdue
          ? "border-rose-200 bg-rose-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-base font-semibold text-slate-900">{commitment.title}</div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
            {statusLabel}
          </span>
          {commitment.isOverdue && (
            <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-700">
              {overdueLabel}
            </span>
          )}
        </div>
      </div>
      {commitment.description && (
        <p className="mt-2 text-sm text-slate-600">{commitment.description}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
        <span>
          {dueLabel}: {formatDate(locale, commitment.dueAt)}
        </span>
        {commitment.closedAt && (
          <span>
            {closedLabel}: {formatDate(locale, commitment.closedAt)}
          </span>
        )}
      </div>
      {roles.length > 0 && (
        <div className="mt-3 text-sm text-slate-600">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {partiesLabel}
          </div>
          <div className="mt-1 space-y-1">
            {roles.map((role) => (
              <div key={role.key}>
                <span className="font-medium text-slate-700">
                  {roleLabels[role.key][locale]}:
                </span>{" "}
                {role.values.join(", ")}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export type { CommitmentCardData };
