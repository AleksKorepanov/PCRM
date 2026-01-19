import { DigestPanel } from "@/components/needs-offers/digest-panel";
import { MatchesPanel } from "@/components/needs-offers/matches-panel";
import { NeedsOffersBoard } from "@/components/needs-offers/needs-offers-board";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { createContact, listAllContacts } from "@/lib/contacts";
import {
  buildDigestData,
  createNeedOffer,
  formatNeedOfferGeo,
  getDigestTemplates,
  listNeedOfferMatches,
  listNeedOffers,
  refreshNeedOfferMatches,
} from "@/lib/needs-offers";
import { getUserLocale } from "@/lib/locale";
import { canManageNeedsOffers } from "@/lib/rbac";
import { getShellContext } from "@/lib/shell-data";
import { getText } from "@/lib/text";

function ensureNeedsOffersContacts(workspaceId: string) {
  const existing = listAllContacts(workspaceId);
  if (existing.length >= 3) {
    return existing.slice(0, 3);
  }

  const needed = [
    { name: "Андрей Лебедев", city: "Москва", tier: "A", trustScore: 82 },
    { name: "Екатерина Орлова", city: "Берлин", tier: "B", trustScore: 71 },
    { name: "Никита Громов", city: "Алматы", tier: "A", trustScore: 78 },
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
        tags: ["needs-offers"],
        organizations: ["North Capital"],
        communities: ["Founders Circle"],
        channels: [],
        notes: [],
      })
    );
  });
  return contacts;
}

function ensureSampleNeedsOffers(workspaceId: string, ownerId: string) {
  const existing = listNeedOffers({ workspaceId, includeExpired: true });
  if (existing.length > 0) {
    return;
  }

  const [contactOne, contactTwo, contactThree] = ensureNeedsOffersContacts(workspaceId);

  createNeedOffer({
    workspaceId,
    ownerUserId: ownerId,
    contactId: contactOne.id,
    entryType: "need",
    title: "Ищу интро с финтех инвесторами",
    description: "Нужны партнеры для pre-seed в Европе, интерес к B2B финтех.",
    tags: ["инвестиции", "финтех", "европа"],
    visibility: "workspace",
    geo: { mode: "local", city: "Москва", country: "Россия" },
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  });

  createNeedOffer({
    workspaceId,
    ownerUserId: ownerId,
    contactId: contactTwo.id,
    entryType: "offer",
    title: "Могу организовать интро с венчурным фондом",
    description: "Есть прямые контакты в фондах, сфокусированных на B2B SaaS и финтех.",
    tags: ["инвестиции", "фонды", "b2b"],
    visibility: "workspace",
    geo: { mode: "remote" },
    expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
  });

  createNeedOffer({
    workspaceId,
    ownerUserId: ownerId,
    contactId: contactThree.id,
    entryType: "need",
    title: "Нужен маркетинг-партнер для запуска комьюнити",
    description: "Ищем эксперта по growth-маркетингу и запуску сообществ в СНГ.",
    tags: ["маркетинг", "комьюнити"],
    visibility: "restricted",
    geo: { mode: "local", city: "Алматы", country: "Казахстан" },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  createNeedOffer({
    workspaceId,
    ownerUserId: "private@pcrm.local",
    contactId: contactOne.id,
    entryType: "offer",
    title: "Частное предложение консультации",
    description: "Закрытый offer для доверенного круга.",
    tags: ["консалтинг"],
    visibility: "private",
    geo: { mode: "local", city: "Москва", country: "Россия" },
  });
}

export default function NeedsOffersPage() {
  const locale = getUserLocale();
  const text = getText(locale);
  const { user, activeWorkspaceId } = getShellContext();
  const canManage = canManageNeedsOffers(user.role);
  const actionTitle = canManage ? undefined : text.actions.accessRestricted;
  const viewer = { userId: user.email, role: user.role };

  ensureSampleNeedsOffers(activeWorkspaceId, user.email);
  refreshNeedOfferMatches({ workspaceId: activeWorkspaceId });

  const contacts = listAllContacts(activeWorkspaceId);
  const contactNames = contacts.reduce<Record<string, string>>((acc, contact) => {
    acc[contact.id] = contact.name;
    return acc;
  }, {});

  const needs = listNeedOffers({
    workspaceId: activeWorkspaceId,
    viewer,
    entryType: "need",
  });
  const offers = listNeedOffers({
    workspaceId: activeWorkspaceId,
    viewer,
    entryType: "offer",
  });

  const needsCards = needs.map((entry) => ({
    ...entry,
    geo: formatNeedOfferGeo(entry),
    ownerName: entry.contactId ? contactNames[entry.contactId] : undefined,
  }));
  const offersCards = offers.map((entry) => ({
    ...entry,
    geo: formatNeedOfferGeo(entry),
    ownerName: entry.contactId ? contactNames[entry.contactId] : undefined,
  }));

  const matches = listNeedOfferMatches({ workspaceId: activeWorkspaceId, viewer }).map(
    (match) => {
      const need = needs.find((entry) => entry.id === match.needId);
      const offer = offers.find((entry) => entry.id === match.offerId);
      return {
        ...match,
        needTitle: need?.title ?? "",
        offerTitle: offer?.title ?? "",
      };
    }
  );

  const templates = getDigestTemplates(activeWorkspaceId);
  const digestData = buildDigestData({
    workspaceId: activeWorkspaceId,
    viewer,
    contactNames,
  });

  return (
    <section className="space-y-8">
      <PageHeader
        title={text.pages.needsOffers.title}
        description={text.pages.needsOffers.description}
        actions={
          <Button
            className="disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canManage}
            title={actionTitle}
          >
            {text.pages.needsOffers.actionLabel}
          </Button>
        }
      />
      <NeedsOffersBoard locale={locale} needs={needsCards} offers={offersCards} />
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {locale === "ru" ? "Матчинг" : "Matching"}
        </h2>
        <MatchesPanel locale={locale} matches={matches} />
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {locale === "ru" ? "Еженедельный дайджест" : "Weekly digest"}
        </h2>
        <DigestPanel
          locale={locale}
          workspaceId={activeWorkspaceId}
          templates={templates}
          data={digestData}
        />
      </div>
    </section>
  );
}
