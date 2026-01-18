import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Contact } from "@/lib/contacts";

const badgeClassName =
  "rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600";

type ContactsTableProps = {
  locale: "ru" | "en";
  contacts: Contact[];
  canEdit: boolean;
  page: number;
  perPage: number;
  total: number;
};

export function ContactsTable({
  locale,
  contacts,
  canEdit,
  page,
  perPage,
  total,
}: ContactsTableProps) {
  const copy =
    locale === "ru"
      ? {
          title: "Список контактов",
          name: "Контакт",
          tier: "Тир",
          trustScore: "Доверие",
          location: "Город",
          tags: "Теги",
          organization: "Организация",
          community: "Сообщество",
          action: "Профиль",
          editDisabled: "Недостаточно прав на редактирование",
          pagination: "Страница",
          of: "из",
        }
      : {
          title: "Contacts",
          name: "Contact",
          tier: "Tier",
          trustScore: "Trust",
          location: "City",
          tags: "Tags",
          organization: "Organization",
          community: "Community",
          action: "Profile",
          editDisabled: "Insufficient access to edit",
          pagination: "Page",
          of: "of",
        };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">{copy.title}</div>
        <div className="text-xs text-slate-500">
          {copy.pagination} {page} {copy.of} {totalPages}
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <div className="grid grid-cols-6 gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div>{copy.name}</div>
          <div>{copy.tier}</div>
          <div>{copy.trustScore}</div>
          <div>{copy.location}</div>
          <div>{copy.tags}</div>
          <div className="text-right">{copy.action}</div>
        </div>
        <div className="divide-y divide-slate-200">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="grid grid-cols-6 gap-4 px-4 py-3 text-sm text-slate-700"
            >
              <div className="space-y-1">
                <div className="font-medium text-slate-900">{contact.name}</div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {contact.organizations.slice(0, 1).map((org) => (
                    <span key={org} className={badgeClassName}>
                      {org}
                    </span>
                  ))}
                  {contact.communities.slice(0, 1).map((community) => (
                    <span key={community} className={badgeClassName}>
                      {community}
                    </span>
                  ))}
                </div>
              </div>
              <div>{contact.tier ?? "—"}</div>
              <div>{contact.trustScore ?? "—"}</div>
              <div>{contact.city ?? "—"}</div>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag) => (
                  <span key={tag} className={badgeClassName}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className="text-right">
                <Link
                  className="text-sm font-medium text-slate-900 underline decoration-slate-300 underline-offset-4"
                  href={`/contacts/${contact.id}`}
                  title={canEdit ? undefined : copy.editDisabled}
                >
                  {copy.action}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
