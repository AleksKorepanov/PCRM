import { Card } from "@/components/ui/card";
import { ContactFilters } from "@/lib/contacts";

const inputClassName =
  "mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none";

const labelClassName = "text-xs font-medium uppercase tracking-wide text-slate-500";

type ContactsFiltersProps = {
  locale: "ru" | "en";
  filters: ContactFilters;
};

export function ContactsFilters({ locale, filters }: ContactsFiltersProps) {
  const copy =
    locale === "ru"
      ? {
          title: "Фильтры",
          tier: "Тир",
          city: "Город",
          tags: "Теги",
          trustScore: "Индекс доверия",
          organization: "Организация",
          community: "Сообщество",
          min: "От",
          max: "До",
        }
      : {
          title: "Filters",
          tier: "Tier",
          city: "City",
          tags: "Tags",
          trustScore: "Trust score",
          organization: "Organization",
          community: "Community",
          min: "Min",
          max: "Max",
        };

  return (
    <Card className="space-y-4">
      <div className="text-sm font-semibold text-slate-900">{copy.title}</div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-1 text-sm text-slate-700">
          <span className={labelClassName}>{copy.tier}</span>
          <input
            className={inputClassName}
            defaultValue={filters.tier ?? ""}
            placeholder={copy.tier}
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span className={labelClassName}>{copy.city}</span>
          <input
            className={inputClassName}
            defaultValue={filters.city ?? ""}
            placeholder={copy.city}
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span className={labelClassName}>{copy.tags}</span>
          <input
            className={inputClassName}
            defaultValue={filters.tags?.join(", ") ?? ""}
            placeholder={copy.tags}
          />
        </label>
        <div className="space-y-1 text-sm text-slate-700">
          <span className={labelClassName}>{copy.trustScore}</span>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className={inputClassName}
              defaultValue={filters.trustScoreMin ?? ""}
              placeholder={copy.min}
              type="number"
            />
            <input
              className={inputClassName}
              defaultValue={filters.trustScoreMax ?? ""}
              placeholder={copy.max}
              type="number"
            />
          </div>
        </div>
        <label className="space-y-1 text-sm text-slate-700">
          <span className={labelClassName}>{copy.organization}</span>
          <input
            className={inputClassName}
            defaultValue={filters.organization ?? ""}
            placeholder={copy.organization}
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span className={labelClassName}>{copy.community}</span>
          <input
            className={inputClassName}
            defaultValue={filters.community ?? ""}
            placeholder={copy.community}
          />
        </label>
      </div>
    </Card>
  );
}
