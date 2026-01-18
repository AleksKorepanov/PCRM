import { ContactForm } from "@/components/contacts/contact-form";
import { ContactsFilters } from "@/components/contacts/contacts-filters";
import { ContactsImportPanel } from "@/components/contacts/contacts-import-panel";
import { ContactsMergePanel } from "@/components/contacts/contacts-merge-panel";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import {
  ContactChannel,
  ContactNote,
  ContactVisibility,
  createContact,
  listContacts,
} from "@/lib/contacts";
import { getUserLocale } from "@/lib/locale";
import { canEditContacts } from "@/lib/rbac";
import { getShellContext } from "@/lib/shell-data";
import { getText } from "@/lib/text";

const sampleNotes = (visibility: ContactVisibility): ContactNote[] => [
  {
    id: "note-1",
    content:
      visibility === "private"
        ? "Частная заметка об истории знакомства."
        : "Публичная заметка о контексте сотрудничества.",
    visibility,
    createdAt: new Date().toISOString(),
  },
];

const sampleChannels = (value: string): ContactChannel[] => [
  { id: "ch-1", type: "email", value, isPrimary: true },
];

function ensureSampleContacts(workspaceId: string): void {
  const existing = listContacts({ workspaceId, page: 1, perPage: 1 });
  if (existing.total > 0) {
    return;
  }

  createContact({
    workspaceId,
    name: "Ирина Смирнова",
    city: "Москва",
    tier: "A",
    trustScore: 92,
    aliases: ["Ира"],
    tags: ["инвестор", "советник"],
    organizations: ["North Capital"],
    communities: ["Fintech Angels"],
    channels: sampleChannels("ira@north.example"),
    notes: sampleNotes("public"),
    lastInteractionAt: "2024-03-12",
  });

  createContact({
    workspaceId,
    name: "Данил Орлов",
    city: "Санкт-Петербург",
    tier: "B",
    trustScore: 76,
    aliases: ["Дан"],
    tags: ["партнер", "дизайн"],
    organizations: ["Studio Orbit"],
    communities: ["Design Leaders"],
    channels: sampleChannels("danil@orbit.example"),
    notes: sampleNotes("private"),
    lastInteractionAt: "2024-02-28",
  });

  createContact({
    workspaceId,
    name: "Анна Ким",
    city: "Алматы",
    tier: "A",
    trustScore: 88,
    aliases: ["Анна"],
    tags: ["маркетинг", "community"],
    organizations: ["Bright Labs"],
    communities: ["Growth Circle"],
    channels: sampleChannels("+7 777 555 12 12"),
    notes: sampleNotes("public"),
    lastInteractionAt: "2024-03-03",
  });
}

export default function ContactsPage() {
  const locale = getUserLocale();
  const text = getText(locale);
  const { user, activeWorkspaceId } = getShellContext();
  const canEdit = canEditContacts(user.role);

  ensureSampleContacts(activeWorkspaceId);

  const filters = {
    tier: "A",
    city: "Москва",
    tags: ["инвестор", "дизайн"],
    trustScoreMin: 60,
    trustScoreMax: 95,
    organization: "North Capital",
    community: "Growth Circle",
  };

  const { contacts, total, page, perPage } = listContacts({
    workspaceId: activeWorkspaceId,
    sort: "last_interaction",
    page: 1,
    perPage: 5,
  });

  const sortingCopy =
    locale === "ru"
      ? {
          label: "Сортировка",
          lastInteraction: "Последний контакт",
          trustScore: "Индекс доверия",
          name: "Имя",
        }
      : {
          label: "Sort",
          lastInteraction: "Last interaction",
          trustScore: "Trust score",
          name: "Name",
        };

  return (
    <section className="space-y-6">
      <PageHeader
        title={text.pages.contacts.title}
        description={text.pages.contacts.description}
        actions={
          <Button
            className="disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canEdit}
            title={canEdit ? undefined : text.actions.accessRestricted}
          >
            {text.pages.contacts.actionLabel}
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <ContactsFilters locale={locale} filters={filters} />
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {sortingCopy.label}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-700">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-white">
                {sortingCopy.lastInteraction}
              </span>
              <span className="rounded-full border border-slate-200 px-3 py-1">
                {sortingCopy.trustScore}
              </span>
              <span className="rounded-full border border-slate-200 px-3 py-1">
                {sortingCopy.name}
              </span>
            </div>
          </div>
          <ContactsTable
            locale={locale}
            contacts={contacts}
            canEdit={canEdit}
            page={page}
            perPage={perPage}
            total={total}
          />
          <div className="grid gap-6 xl:grid-cols-2">
            <ContactsImportPanel
              locale={locale}
              workspaceId={activeWorkspaceId}
              canEdit={canEdit}
            />
            <ContactsMergePanel
              locale={locale}
              workspaceId={activeWorkspaceId}
              canEdit={canEdit}
              contacts={contacts}
            />
          </div>
        </div>
        <ContactForm locale={locale} canEdit={canEdit} />
      </div>
    </section>
  );
}
