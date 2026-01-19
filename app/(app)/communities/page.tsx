import { CommunitiesDashboard } from "@/components/communities/communities-dashboard";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { createContact, listAllContacts } from "@/lib/contacts";
import {
  Community,
  createCommunity,
  createCommunityMembership,
  listCommunities,
  listCommunityMemberships,
} from "@/lib/communities";
import { getUserLocale } from "@/lib/locale";
import { createNeedOffer, listNeedOffers } from "@/lib/needs-offers";
import { canCreateRecords } from "@/lib/rbac";
import { getShellContext } from "@/lib/shell-data";
import { getText } from "@/lib/text";

function ensureCommunityContacts(workspaceId: string) {
  const existing = listAllContacts(workspaceId);
  if (existing.length >= 4) {
    return existing.slice(0, 4);
  }

  const needed = [
    { name: "Мария Жукова", city: "Москва", tier: "A", trustScore: 82 },
    { name: "Илья Сорокин", city: "Санкт-Петербург", tier: "B", trustScore: 74 },
    { name: "Анна Кузнецова", city: "Берлин", tier: "B", trustScore: 69 },
    { name: "Дмитрий Орлов", city: "Алматы", tier: "A", trustScore: 77 },
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
        tags: ["community"],
        organizations: ["PCRM Network"],
        communities: [],
        channels: [],
        notes: [],
      })
    );
  });
  return contacts;
}

function ensureCommunities(workspaceId: string) {
  const existing = listCommunities(workspaceId);
  if (existing.length > 0) {
    return existing;
  }

  const communities: Community[] = [];
  communities.push(
    createCommunity({
      workspaceId,
      name: "Growth Founders Circle",
      description: "Закрытое сообщество основателей для обмена интро и сделок.",
      rules: ["Взаимный нетворкинг", "1 интро в неделю", "Без холодного спама"],
      entryRequirements: ["Рекомендация участника", "1+ успешный exit"],
      links: [
        { label: "Notion", url: "https://notion.so/growth-founders" },
        { label: "Telegram", url: "https://t.me/growth_founders" },
      ],
    })
  );
  communities.push(
    createCommunity({
      workspaceId,
      name: "Women in Tech Hub",
      description: "Сообщество для поддержки женщин-лидеров в технологиях.",
      rules: ["Поддержка и обмен опытом", "Без рекрутинга без согласия"],
      entryRequirements: ["Работа в tech", "Заполненный профиль"],
      links: [
        { label: "Website", url: "https://wit.example.com" },
        { label: "LinkedIn", url: "https://linkedin.com/company/wit" },
      ],
    })
  );

  return communities;
}

function ensureCommunityMemberships(workspaceId: string) {
  const existing = listCommunityMemberships({ workspaceId });
  if (existing.length > 0) {
    return existing;
  }

  const contacts = ensureCommunityContacts(workspaceId);
  const communities = ensureCommunities(workspaceId);

  if (contacts.length === 0 || communities.length === 0) {
    return existing;
  }

  const [communityA, communityB] = communities;
  const [contactOne, contactTwo, contactThree, contactFour] = contacts;

  createCommunityMembership({
    workspaceId,
    communityId: communityA.id,
    contactId: contactOne.id,
    role: "organizer",
    joinedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  });
  createCommunityMembership({
    workspaceId,
    communityId: communityA.id,
    contactId: contactTwo.id,
    role: "member",
    joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  });
  createCommunityMembership({
    workspaceId,
    communityId: communityB?.id ?? communityA.id,
    contactId: contactThree.id,
    role: "mentor",
    joinedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  });
  createCommunityMembership({
    workspaceId,
    communityId: communityB?.id ?? communityA.id,
    contactId: contactFour.id,
    role: "member",
    joinedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return listCommunityMemberships({ workspaceId });
}

function ensureCommunityNeedsOffers(workspaceId: string, ownerId: string) {
  const existing = listNeedOffers({ workspaceId, includeExpired: true });
  if (existing.length > 0) {
    return;
  }

  const contacts = ensureCommunityContacts(workspaceId);
  if (contacts.length < 2) {
    return;
  }

  createNeedOffer({
    workspaceId,
    ownerUserId: ownerId,
    contactId: contacts[0]?.id,
    entryType: "need",
    title: "Ищу партнеров для demo day",
    description: "Нужны интро с акселераторами в Европе и менторами.",
    tags: ["акселератор", "интро"],
    status: "open",
    visibility: "workspace",
  });

  createNeedOffer({
    workspaceId,
    ownerUserId: ownerId,
    contactId: contacts[1]?.id,
    entryType: "offer",
    title: "Готова подключить HR лидов",
    description: "Могу сделать интро с HR лидерами для hiring и people ops.",
    tags: ["hr", "talent"],
    status: "matched",
    visibility: "workspace",
  });
}

export default function CommunitiesPage() {
  const locale = getUserLocale();
  const text = getText(locale);
  const { user, activeWorkspaceId } = getShellContext();

  ensureCommunityMemberships(activeWorkspaceId);
  ensureCommunityNeedsOffers(activeWorkspaceId, user.email);

  const communities = listCommunities(activeWorkspaceId);
  const memberships = listCommunityMemberships({ workspaceId: activeWorkspaceId });
  const contacts = listAllContacts(activeWorkspaceId);
  const contactNames = contacts.reduce<Record<string, string>>((acc, contact) => {
    acc[contact.id] = contact.name;
    return acc;
  }, {});
  const communityNames = communities.reduce<Record<string, string>>(
    (acc, community) => {
      acc[community.id] = community.name;
      return acc;
    },
    {}
  );

  const membershipCards = memberships.map((membership) => ({
    ...membership,
    contactName: contactNames[membership.contactId] ?? membership.contactId,
    communityName: communityNames[membership.communityId] ?? membership.communityId,
  }));

  const contactCommunityIds = memberships.reduce<Record<string, string[]>>(
    (acc, membership) => {
      if (!acc[membership.contactId]) {
        acc[membership.contactId] = [];
      }
      acc[membership.contactId]?.push(membership.communityId);
      return acc;
    },
    {}
  );

  const needsOffers = listNeedOffers({
    workspaceId: activeWorkspaceId,
    viewer: { userId: user.email, role: user.role },
  })
    .filter((entry) => entry.contactId && contactCommunityIds[entry.contactId])
    .map((entry) => ({
      ...entry,
      contactName: entry.contactId
        ? contactNames[entry.contactId] ?? entry.contactId
        : "",
      communityIds: entry.contactId ? contactCommunityIds[entry.contactId] ?? [] : [],
    }));

  return (
    <section className="space-y-6">
      <PageHeader
        title={text.pages.communities.title}
        description={text.pages.communities.description}
        actions={
          <Button
            className="disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canCreateRecords(user.role)}
            title={
              canCreateRecords(user.role) ? undefined : text.actions.accessRestricted
            }
          >
            {text.pages.communities.actionLabel}
          </Button>
        }
      />
      <CommunitiesDashboard
        locale={locale}
        communities={communities}
        memberships={membershipCards}
        needsOffers={needsOffers}
      />
    </section>
  );
}
