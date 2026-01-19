import { IntroductionsBoard } from "@/components/introductions/introductions-board";
import { IntroTemplatesPanel } from "@/components/introductions/intro-templates-panel";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createContact, listAllContacts } from "@/lib/contacts";
import {
  createIntroduction,
  getIntroductionTemplates,
  listIntroductions,
  recordIntroductionOutcome,
  updateIntroductionConsent,
} from "@/lib/introductions";
import { listInteractions } from "@/lib/interactions";
import { getUserLocale } from "@/lib/locale";
import { canCoordinateIntroductions } from "@/lib/rbac";
import { getShellContext } from "@/lib/shell-data";
import { getText } from "@/lib/text";

function ensureIntroductionContacts(workspaceId: string) {
  const existing = listAllContacts(workspaceId);
  if (existing.length >= 4) {
    return existing.slice(0, 4);
  }

  const needed = [
    { name: "Ирина Морозова", city: "Москва", tier: "A", trustScore: 88 },
    { name: "Леонид Сергеев", city: "Рига", tier: "B", trustScore: 74 },
    { name: "Милана Демидова", city: "Прага", tier: "A", trustScore: 81 },
    { name: "Савелий Орлов", city: "Вильнюс", tier: "B", trustScore: 69 },
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
        tags: ["introductions"],
        organizations: ["North Capital"],
        communities: ["Founders Circle"],
        channels: [],
        notes: [],
      })
    );
  });
  return contacts;
}

function ensureSampleIntroductions(workspaceId: string) {
  const existing = listIntroductions({ workspaceId });
  if (existing.length > 0) {
    return;
  }

  const [introducer, contactA, contactB, contactC] =
    ensureIntroductionContacts(workspaceId);

  const introOne = createIntroduction({
    workspaceId,
    introducerContactId: introducer.id,
    contactAId: contactA.id,
    contactBId: contactB.id,
    ask: "Ищу партнера для выхода на рынок Германии",
    context: "Обе стороны работают в финтехе и ищут совместные пилоты.",
    consentPolicy: "mutual",
  });

  updateIntroductionConsent({
    workspaceId,
    introductionId: introOne.id,
    contactId: contactA.id,
    status: "approved",
  });

  const introTwo = createIntroduction({
    workspaceId,
    introducerContactId: introducer.id,
    contactAId: contactB.id,
    contactBId: contactC.id,
    ask: "Нужно warm intro для обсуждения партнерства",
    context: "Запрос от стартапа на стратегического партнера.",
    consentPolicy: "single",
    consents: [
      { contactId: contactB.id, status: "approved" },
      { contactId: contactC.id, status: "approved" },
    ],
  });

  recordIntroductionOutcome({
    workspaceId,
    introductionId: introTwo.id,
    status: "connected",
    summary: "Созваниваются на следующей неделе, обсуждают пилот.",
  });
}

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

export default function IntroductionsPage() {
  const locale = getUserLocale();
  const text = getText(locale);
  const { user, activeWorkspaceId } = getShellContext();
  const canManage = canCoordinateIntroductions(user.role);
  const actionTitle = canManage ? undefined : text.actions.accessRestricted;

  ensureSampleIntroductions(activeWorkspaceId);

  const introductions = listIntroductions({ workspaceId: activeWorkspaceId });
  const contacts = listAllContacts(activeWorkspaceId);
  const contactNames = contacts.reduce<Record<string, string>>((acc, contact) => {
    acc[contact.id] = contact.name;
    return acc;
  }, {});

  const introCards = introductions.map((intro) => ({
    id: intro.id,
    status: intro.status,
    introducerName: contactNames[intro.introducerContactId] ?? intro.introducerContactId,
    contactAName: contactNames[intro.contactAId] ?? intro.contactAId,
    contactBName: contactNames[intro.contactBId] ?? intro.contactBId,
    ask: intro.ask,
    context: intro.context,
    consentPolicy: intro.consentPolicy,
    consents: intro.consents.map((consent) => ({
      contactName: contactNames[consent.contactId] ?? consent.contactId,
      status: consent.status,
    })),
    outcome: intro.outcome,
  }));

  const templates = getIntroductionTemplates(activeWorkspaceId);
  const templateTokens = introCards[0]
    ? {
        introducerName: introCards[0].introducerName,
        contactAName: introCards[0].contactAName,
        contactBName: introCards[0].contactBName,
        ask: introCards[0].ask,
        context: introCards[0].context,
        outcome:
          introCards[0].outcome?.summary ??
          (locale === "ru" ? "Интро в процессе" : "Intro in progress"),
      }
    : {
        introducerName: "",
        contactAName: "",
        contactBName: "",
        ask: "",
        context: "",
        outcome: "",
      };

  const timelineEvents = listInteractions({
    workspaceId: activeWorkspaceId,
    role: user.role,
    query: "intro",
  }).interactions.filter(
    (interaction) =>
      interaction.subject === "Intro outcome" ||
      interaction.summary?.startsWith("[intro]")
  );

  return (
    <section className="space-y-8">
      <PageHeader
        title={text.pages.introductions.title}
        description={text.pages.introductions.description}
        actions={
          <Button
            className="disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canManage}
            title={actionTitle}
          >
            {text.pages.introductions.actionLabel}
          </Button>
        }
      />
      <IntroductionsBoard locale={locale} introductions={introCards} />
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {locale === "ru" ? "События таймлайна" : "Timeline events"}
        </h2>
        {timelineEvents.length === 0 ? (
          <Card className="p-4 text-sm text-slate-600">
            {locale === "ru"
              ? "Пока нет событий по интро."
              : "No intro timeline events yet."}
          </Card>
        ) : (
          <div className="space-y-3">
            {timelineEvents.map((event) => (
              <Card key={event.id} className="p-4">
                <div className="text-sm font-semibold text-slate-900">
                  {event.subject}
                </div>
                {event.summary && (
                  <div className="mt-1 text-sm text-slate-600">{event.summary}</div>
                )}
                <div className="mt-2 text-xs text-slate-500">
                  {formatDate(locale, event.occurredAt)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {locale === "ru" ? "Шаблоны сообщений" : "Message templates"}
        </h2>
        <IntroTemplatesPanel
          locale={locale}
          workspaceId={activeWorkspaceId}
          tokens={templateTokens}
          templates={templates}
        />
      </div>
    </section>
  );
}
