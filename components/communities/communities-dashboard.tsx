"use client";

import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { Community, CommunityLink, CommunityMembership } from "@/lib/communities";
import { NeedOffer, NeedOfferStatus, NeedOfferType } from "@/lib/needs-offers";

const inputClassName =
  "mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none";

const labelClassName = "text-xs font-medium uppercase tracking-wide text-slate-500";

export type CommunityMemberCard = CommunityMembership & {
  contactName: string;
  communityName: string;
};

export type CommunityNeedOfferCard = NeedOffer & {
  contactName: string;
  communityIds: string[];
};

type CommunitiesDashboardProps = {
  locale: "ru" | "en";
  communities: Community[];
  memberships: CommunityMemberCard[];
  needsOffers: CommunityNeedOfferCard[];
};

type FilterOption = {
  value: string;
  label: string;
};

function formatDate(value: string | undefined, locale: "ru" | "en"): string {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCommunityLinks(links: CommunityLink[]): string[] {
  return links.map((link) => link.label ?? link.url);
}

export function CommunitiesDashboard({
  locale,
  communities,
  memberships,
  needsOffers,
}: CommunitiesDashboardProps) {
  const [selectedCommunityId, setSelectedCommunityId] = useState(
    communities[0]?.id ?? "all"
  );
  const [memberRoleFilter, setMemberRoleFilter] = useState("all");
  const [memberSearch, setMemberSearch] = useState("");
  const [needsTypeFilter, setNeedsTypeFilter] = useState<"all" | NeedOfferType>(
    "all"
  );
  const [needsStatusFilter, setNeedsStatusFilter] = useState<
    "all" | NeedOfferStatus
  >("all");

  const copy =
    locale === "ru"
      ? {
          communityLabel: "Сообщество",
          communityAll: "Все сообщества",
          roleLabel: "Роль",
          roleAll: "Все роли",
          searchLabel: "Поиск",
          searchPlaceholder: "Имя участника",
          needsTypeLabel: "Тип",
          needsTypeAll: "Все типы",
          needsStatusLabel: "Статус",
          needsStatusAll: "Все статусы",
          membersTitle: "Участники",
          needsTitle: "Needs/Offers участников",
          rulesLabel: "Правила",
          entryLabel: "Условия вступления",
          linksLabel: "Ссылки",
          noMembers: "Нет участников по выбранным фильтрам.",
          noNeeds: "Нет совпадений по Needs/Offers.",
          roleEmpty: "Роль не указана",
          joined: "Вступил",
          left: "Вышел",
        }
      : {
          communityLabel: "Community",
          communityAll: "All communities",
          roleLabel: "Role",
          roleAll: "All roles",
          searchLabel: "Search",
          searchPlaceholder: "Member name",
          needsTypeLabel: "Type",
          needsTypeAll: "All types",
          needsStatusLabel: "Status",
          needsStatusAll: "All statuses",
          membersTitle: "Members",
          needsTitle: "Members' Needs/Offers",
          rulesLabel: "Rules",
          entryLabel: "Entry requirements",
          linksLabel: "Links",
          noMembers: "No members match the selected filters.",
          noNeeds: "No Needs/Offers entries match.",
          roleEmpty: "Role not set",
          joined: "Joined",
          left: "Left",
        };

  const communityOptions: FilterOption[] = [
    { value: "all", label: copy.communityAll },
    ...communities.map((community) => ({
      value: community.id,
      label: community.name,
    })),
  ];

  const roleOptions = useMemo(() => {
    const roles = new Set(
      memberships.map((membership) => membership.role).filter(Boolean) as string[]
    );
    return [
      { value: "all", label: copy.roleAll },
      ...Array.from(roles).map((role) => ({ value: role, label: role })),
    ];
  }, [copy.roleAll, memberships]);

  const selectedCommunity = useMemo(
    () => communities.find((community) => community.id === selectedCommunityId),
    [communities, selectedCommunityId]
  );

  const filteredMembers = useMemo(() => {
    const search = memberSearch.trim().toLowerCase();
    return memberships.filter((membership) => {
      if (selectedCommunityId !== "all" && membership.communityId !== selectedCommunityId) {
        return false;
      }
      if (memberRoleFilter !== "all" && membership.role !== memberRoleFilter) {
        return false;
      }
      if (search && !membership.contactName.toLowerCase().includes(search)) {
        return false;
      }
      return true;
    });
  }, [memberRoleFilter, memberSearch, memberships, selectedCommunityId]);

  const filteredNeedsOffers = useMemo(() => {
    return needsOffers.filter((entry) => {
      if (selectedCommunityId !== "all") {
        if (!entry.communityIds.includes(selectedCommunityId)) {
          return false;
        }
      }
      if (needsTypeFilter !== "all" && entry.entryType !== needsTypeFilter) {
        return false;
      }
      if (needsStatusFilter !== "all" && entry.status !== needsStatusFilter) {
        return false;
      }
      return true;
    });
  }, [needsOffers, needsStatusFilter, needsTypeFilter, selectedCommunityId]);

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="text-sm font-semibold text-slate-900">
          {locale === "ru" ? "Фильтры" : "Filters"}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-sm text-slate-700">
            <span className={labelClassName}>{copy.communityLabel}</span>
            <select
              className={inputClassName}
              value={selectedCommunityId}
              onChange={(event) => setSelectedCommunityId(event.target.value)}
            >
              {communityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span className={labelClassName}>{copy.roleLabel}</span>
            <select
              className={inputClassName}
              value={memberRoleFilter}
              onChange={(event) => setMemberRoleFilter(event.target.value)}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span className={labelClassName}>{copy.searchLabel}</span>
            <input
              className={inputClassName}
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder={copy.searchPlaceholder}
            />
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span className={labelClassName}>{copy.needsTypeLabel}</span>
            <select
              className={inputClassName}
              value={needsTypeFilter}
              onChange={(event) =>
                setNeedsTypeFilter(event.target.value as "all" | NeedOfferType)
              }
            >
              <option value="all">{copy.needsTypeAll}</option>
              <option value="need">Need</option>
              <option value="offer">Offer</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span className={labelClassName}>{copy.needsStatusLabel}</span>
            <select
              className={inputClassName}
              value={needsStatusFilter}
              onChange={(event) =>
                setNeedsStatusFilter(event.target.value as "all" | NeedOfferStatus)
              }
            >
              <option value="all">{copy.needsStatusAll}</option>
              <option value="open">Open</option>
              <option value="matched">Matched</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="text-lg font-semibold text-slate-900">{copy.membersTitle}</div>
          {filteredMembers.length === 0 ? (
            <div className="text-sm text-slate-500">{copy.noMembers}</div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <Card key={member.id} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {member.contactName}
                      </div>
                      <div className="text-xs text-slate-500">{member.communityName}</div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {member.role ?? copy.roleEmpty}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {member.joinedAt && (
                      <span>
                        {copy.joined}: {formatDate(member.joinedAt, locale)}
                      </span>
                    )}
                    {member.leftAt && (
                      <span className="ml-3">
                        {copy.left}: {formatDate(member.leftAt, locale)}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        <Card className="space-y-4">
          <div className="text-sm font-semibold text-slate-900">
            {selectedCommunity?.name ?? copy.communityAll}
          </div>
          {selectedCommunity ? (
            <div className="space-y-3 text-sm text-slate-600">
              {selectedCommunity.description && (
                <p className="text-slate-600">{selectedCommunity.description}</p>
              )}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {copy.rulesLabel}
                </div>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {selectedCommunity.rules.length > 0
                    ? selectedCommunity.rules.map((rule) => <li key={rule}>{rule}</li>)
                    : [
                        <li key="empty">{locale === "ru" ? "Нет данных" : "Not set"}</li>,
                      ]}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {copy.entryLabel}
                </div>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {selectedCommunity.entryRequirements.length > 0
                    ? selectedCommunity.entryRequirements.map((req) => (
                        <li key={req}>{req}</li>
                      ))
                    : [
                        <li key="empty">{locale === "ru" ? "Нет данных" : "Not set"}</li>,
                      ]}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {copy.linksLabel}
                </div>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {selectedCommunity.links.length > 0
                    ? formatCommunityLinks(selectedCommunity.links).map((link) => (
                        <li key={link}>{link}</li>
                      ))
                    : [
                        <li key="empty">{locale === "ru" ? "Нет данных" : "Not set"}</li>,
                      ]}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              {locale === "ru" ? "Выберите сообщество." : "Select a community."}
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <div className="text-lg font-semibold text-slate-900">{copy.needsTitle}</div>
        {filteredNeedsOffers.length === 0 ? (
          <div className="text-sm text-slate-500">{copy.noNeeds}</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredNeedsOffers.map((entry) => (
              <Card key={entry.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {entry.entryType}
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {entry.title}
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {entry.status}
                  </span>
                </div>
                <div className="text-sm text-slate-600">{entry.description}</div>
                <div className="text-xs text-slate-500">
                  {entry.contactName}
                </div>
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
