import { ContactProfileHeader } from "@/components/contacts/contact-profile-header";
import { ContactProfileTabs } from "@/components/contacts/contact-profile-tabs";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { createContact, getContact } from "@/lib/contacts";
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

type ContactProfilePageProps = {
  params: { contactId: string };
};

export default function ContactProfilePage({ params }: ContactProfilePageProps) {
  const locale = getUserLocale();
  const text = getText(locale);
  const { user, activeWorkspaceId } = getShellContext();
  const canEdit = canEditContacts(user.role);
  const contact = ensureContact(activeWorkspaceId, params.contactId);

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
      <ContactProfileTabs locale={locale} />
    </section>
  );
}
