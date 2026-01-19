import { ContactProfileHeader } from "@/components/contacts/contact-profile-header";
import {
  ContactProfileTabs,
  TimelineInteraction,
} from "@/components/contacts/contact-profile-tabs";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { createContact, getContact } from "@/lib/contacts";
import { createFollowup, createInteraction, listInteractions } from "@/lib/interactions";
import { getUserLocale } from "@/lib/locale";
import { canEditContacts } from "@/lib/rbac";
import { getShellContext } from "@/lib/shell-data";
import { getText } from "@/lib/text";

function ensureContact(workspaceId: string, contactId: string) {
  const existing = getContact({ workspaceId, contactId });
  if (existing) {
    return existing;
  }
  return createContact({
    workspaceId,
    name: "Новый контакт",
    city: "",
    tier: "B",
    trustScore: 70,
    aliases: ["Контакт"],
    tags: ["новый"],
    organizations: [""],
    communities: [""],
    channels: [],
    notes: [],
  });
}

function ensureSampleInteractions(
  workspaceId: string,
  contactId: string,
  createdBy: string
): void {
  const existing = listInteractions({
    workspaceId,
    role: "owner",
    contactId,
    page: 1,
    perPage: 1,
  });
  if (existing.total > 0) {
    return;
  }

  const partner = createContact({
    workspaceId,
    name: "Иван Петров",
    city: "Москва",
    tier: "B",
    trustScore: 81,
    aliases: ["Ваня"],
    tags: ["партнер"],
    organizations: ["North Capital"],
    communities: ["Fintech Angels"],
    channels: [],
    notes: [],
  });

  const kickoff = createInteraction({
    workspaceId,
    subject: "Созвон по стратегическому партнерству",
    summary:
      "Обсудили интеграцию и договорились подготовить предложение до конца недели.",
    interactionType: "call",
    occurredAt: "2024-03-20T10:00:00Z",
    privacyLevel: "workspace",
    participants: [
      { contactId, role: "host" },
      { contactId: partner.id, role: "guest" },
    ],
    organizations: ["North Capital"],
    communities: ["Fintech Angels"],
    links: [{ url: "https://zoom.us/j/123", label: "Zoom" }],
    createdBy,
  });

  createFollowup({
    workspaceId,
    interactionId: kickoff.id,
    assignedToUserId: createdBy,
    dueAt: "2024-03-25T09:00:00Z",
    status: "open",
    notes: "Подготовить коммерческое предложение.",
  });

  createInteraction({
    workspaceId,
    subject: "Личная заметка после встречи",
    summary:
      "Контакт положительно отнесся к инициативе, но просит четкие KPI.",
    interactionType: "note",
    occurredAt: "2024-03-20T12:30:00Z",
    privacyLevel: "private",
    participants: [{ contactId }],
    createdBy,
  });
}

type ContactProfilePageProps = {
  params: { contactId: string };
};

export default function ContactProfilePage({ params }: ContactProfilePageProps) {
  const locale = getUserLocale();
  const text = getText(locale);
  const { user, activeWorkspaceId } = getShellContext();
  const canEdit = canEditContacts(user.role);
  const contact = ensureContact(activeWorkspaceId, params.contactId);
  ensureSampleInteractions(activeWorkspaceId, contact.id, user.email);

  const interactions = listInteractions({
    workspaceId: activeWorkspaceId,
    role: user.role,
    contactId: contact.id,
    page: 1,
    perPage: 10,
  }).interactions;

  const participantNames = new Map<string, string>([[contact.id, contact.name]]);
  interactions.forEach((interaction) => {
    interaction.participants.forEach((participant) => {
      const participantContact = getContact({
        workspaceId: activeWorkspaceId,
        contactId: participant.contactId,
      });
      if (participantContact) {
        participantNames.set(participantContact.id, participantContact.name);
      }
    });
  });

  const timelineInteractions: TimelineInteraction[] = interactions.map((interaction) => ({
    ...interaction,
    participantNames: interaction.participants.map(
      (participant) => participantNames.get(participant.contactId) ?? participant.contactId
    ),
  }));

  const title =
    locale === "ru"
      ? "Профиль контакта"
      : "Contact profile";

  return (
    <section className="space-y-6">
      <PageHeader
        title={title}
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
      <ContactProfileHeader contact={contact} locale={locale} />
      <ContactProfileTabs locale={locale} interactions={timelineInteractions} />
    </section>
  );
}
