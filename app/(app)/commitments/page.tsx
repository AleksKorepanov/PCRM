import { CommitmentsBoard } from "@/components/commitments/commitments-board";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { createContact, getContact, listAllContacts } from "@/lib/contacts";
import { createCommitment, isCommitmentOverdue, listCommitments } from "@/lib/commitments";
import { getUserLocale } from "@/lib/locale";
import { canManageCommitments } from "@/lib/rbac";
import { getShellContext } from "@/lib/shell-data";
import { getText } from "@/lib/text";

function ensureCommitmentContacts(workspaceId: string) {
  const existing = listAllContacts(workspaceId);
  if (existing.length >= 3) {
    return existing.slice(0, 3);
  }

  const needed = [
    { name: "Алина Захарова", city: "Москва", tier: "A", trustScore: 86 },
    { name: "Денис Серов", city: "Казань", tier: "B", trustScore: 72 },
    { name: "Мария Левина", city: "Санкт-Петербург", tier: "A", trustScore: 79 },
  ];

  const contacts = [...existing];
  needed.slice(existing.length).forEach((contact) => {
    contacts.push(
      createContact({
        workspaceId,
        name: contact.name,
        city: contact.city,
        tier: contact.tier,
        trustScore: contact.trustScore,
        aliases: [contact.name.split(" ")[0] ?? contact.name],
        tags: ["обязательство"],
        organizations: ["North Capital"],
        communities: ["Founders Circle"],
        channels: [],
        notes: [],
      })
    );
  });
  return contacts;
}

function ensureSampleCommitments(workspaceId: string): void {
  const existing = listCommitments({ workspaceId });
  if (existing.length > 0) {
    return;
  }

  const [owedBy, owesTo, observer] = ensureCommitmentContacts(workspaceId);

  createCommitment({
    workspaceId,
    title: "Подготовить инвестиционный тизер",
    description: "Согласовать с командой и отправить в течение недели.",
    status: "open",
    dueAt: "2024-01-15T12:00:00Z",
    parties: [
      { contactId: owedBy.id, role: "owed_by" },
      { contactId: owesTo.id, role: "owes_to" },
      { contactId: observer.id, role: "observer" },
    ],
  });

  createCommitment({
    workspaceId,
    title: "Организовать интро с инвестором",
    description: "Сделать warm intro до следующего демо-дня.",
    status: "in_progress",
    dueAt: "2024-04-10T09:00:00Z",
    parties: [
      { contactId: owedBy.id, role: "owed_by" },
      { contactId: owesTo.id, role: "owes_to" },
    ],
  });

  createCommitment({
    workspaceId,
    title: "Отправить обновление по метрикам",
    description: "Еженедельный апдейт для стейкхолдеров.",
    status: "fulfilled",
    dueAt: "2024-03-01T18:00:00Z",
    closedAt: "2024-02-28T10:00:00Z",
    parties: [
      { contactId: owesTo.id, role: "owed_by" },
      { contactId: owedBy.id, role: "owes_to" },
    ],
  });
}

export default function CommitmentsPage() {
  const locale = getUserLocale();
  const text = getText(locale);
  const { user, activeWorkspaceId } = getShellContext();
  const canManage = canManageCommitments(user.role);
  const actionTitle = canManage ? undefined : text.actions.accessRestricted;

  ensureSampleCommitments(activeWorkspaceId);
  const commitments = listCommitments({ workspaceId: activeWorkspaceId }).map(
    (commitment) => {
      const partyNames = commitment.parties.reduce(
        (acc, party) => {
          const contact = getContact({
            workspaceId: activeWorkspaceId,
            contactId: party.contactId,
          });
          const name = contact?.name ?? party.contactId;
          acc[party.role].push(name);
          return acc;
        },
        {
          owed_by: [] as string[],
          owes_to: [] as string[],
          observer: [] as string[],
        }
      );

      return {
        id: commitment.id,
        title: commitment.title,
        description: commitment.description,
        status: commitment.status,
        dueAt: commitment.dueAt,
        closedAt: commitment.closedAt,
        isOverdue: isCommitmentOverdue(commitment),
        owedBy: partyNames.owed_by,
        owesTo: partyNames.owes_to,
        observers: partyNames.observer,
      };
    }
  );

  return (
    <section className="space-y-6">
      <PageHeader
        title={text.pages.commitments.title}
        description={text.pages.commitments.description}
        actions={
          <Button
            className="disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canManage}
            title={actionTitle}
          >
            {text.pages.commitments.actionLabel}
          </Button>
        }
      />
      <CommitmentsBoard locale={locale} commitments={commitments} />
    </section>
  );
}
