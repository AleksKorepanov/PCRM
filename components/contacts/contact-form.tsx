import { Card } from "@/components/ui/card";
import { ContactChannelType, ContactVisibility } from "@/lib/contacts";

const inputClassName =
  "mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none";

const labelClassName = "text-xs font-medium uppercase tracking-wide text-slate-500";

const channelTypes: ContactChannelType[] = [
  "phone",
  "email",
  "telegram",
  "whatsapp",
];

const visibilityOptions: ContactVisibility[] = ["public", "private"];

type ContactFormProps = {
  locale: "ru" | "en";
  canEdit: boolean;
};

export function ContactForm({ locale, canEdit }: ContactFormProps) {
  const copy =
    locale === "ru"
      ? {
          title: "Создание / редактирование",
          name: "Имя",
          aliases: "Алиасы",
          channels: "Каналы",
          tier: "Тир",
          trustScore: "Индекс доверия",
          introducedBy: "Кем представлен",
          visibility: "Видимость полей",
          placeholderAliases: "Например: Виктор, Вика",
          placeholderChannel: "Контакт",
          disabled: "Редактирование доступно с роли ассистента",
        }
      : {
          title: "Create / edit",
          name: "Name",
          aliases: "Aliases",
          channels: "Channels",
          tier: "Tier",
          trustScore: "Trust score",
          introducedBy: "Introduced by",
          visibility: "Field visibility",
          placeholderAliases: "Example: Victor, Vika",
          placeholderChannel: "Contact",
          disabled: "Editing is available starting from assistant role",
        };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">{copy.title}</div>
        {!canEdit ? (
          <span className="text-xs text-slate-500">{copy.disabled}</span>
        ) : null}
      </div>
      <div className="grid gap-4">
        <label className="space-y-1 text-sm text-slate-700">
          <span className={labelClassName}>{copy.name}</span>
          <input
            className={inputClassName}
            placeholder={copy.name}
            disabled={!canEdit}
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span className={labelClassName}>{copy.aliases}</span>
          <input
            className={inputClassName}
            placeholder={copy.placeholderAliases}
            disabled={!canEdit}
          />
        </label>
        <div className="space-y-2">
          <span className={labelClassName}>{copy.channels}</span>
          <div className="grid gap-2">
            {channelTypes.map((channel) => (
              <div key={channel} className="grid grid-cols-3 gap-2">
                <input
                  className={inputClassName}
                  defaultValue={channel}
                  disabled
                />
                <input
                  className={inputClassName}
                  placeholder={copy.placeholderChannel}
                  disabled={!canEdit}
                />
                <input
                  className={inputClassName}
                  defaultValue="Primary"
                  disabled
                />
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-700">
            <span className={labelClassName}>{copy.tier}</span>
            <input className={inputClassName} disabled={!canEdit} />
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span className={labelClassName}>{copy.trustScore}</span>
            <input
              className={inputClassName}
              type="number"
              disabled={!canEdit}
            />
          </label>
        </div>
        <label className="space-y-1 text-sm text-slate-700">
          <span className={labelClassName}>{copy.introducedBy}</span>
          <input className={inputClassName} disabled={!canEdit} />
        </label>
        <div className="space-y-2">
          <span className={labelClassName}>{copy.visibility}</span>
          <div className="grid gap-2 md:grid-cols-2">
            {[copy.name, copy.trustScore, copy.tier, copy.introducedBy].map(
              (field) => (
                <label key={field} className="space-y-1 text-sm text-slate-700">
                  <span className="text-xs text-slate-500">{field}</span>
                  <select
                    className={inputClassName}
                    defaultValue={visibilityOptions[0]}
                    disabled={!canEdit}
                  >
                    {visibilityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              )
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
