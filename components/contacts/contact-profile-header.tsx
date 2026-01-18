import { Card } from "@/components/ui/card";
import { Contact } from "@/lib/contacts";

const badgeClassName =
  "rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600";

type ContactProfileHeaderProps = {
  contact: Contact;
  locale: "ru" | "en";
};

export function ContactProfileHeader({ contact, locale }: ContactProfileHeaderProps) {
  const copy =
    locale === "ru"
      ? {
          trustScore: "Индекс доверия",
          tier: "Тир",
          introducedBy: "Кем представлен",
          aliases: "Алиасы",
        }
      : {
          trustScore: "Trust score",
          tier: "Tier",
          introducedBy: "Introduced by",
          aliases: "Aliases",
        };

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <div className="text-lg font-semibold text-slate-900">{contact.name}</div>
        <div className="text-sm text-slate-500">{contact.city ?? "—"}</div>
      </div>
      <div className="grid gap-4 text-sm text-slate-700 md:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">
            {copy.trustScore}
          </div>
          <div className="font-medium text-slate-900">
            {contact.trustScore ?? "—"}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">{copy.tier}</div>
          <div className="font-medium text-slate-900">{contact.tier ?? "—"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">
            {copy.introducedBy}
          </div>
          <div className="font-medium text-slate-900">
            {contact.introducedBy ?? "—"}
          </div>
        </div>
      </div>
      {contact.aliases.length ? (
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            {copy.aliases}
          </div>
          <div className="flex flex-wrap gap-2">
            {contact.aliases.map((alias) => (
              <span key={alias} className={badgeClassName}>
                {alias}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
