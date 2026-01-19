"use client";

import { useState } from "react";

import { CommitmentCard, CommitmentCardData } from "@/components/commitments/commitment-card";
import { Card } from "@/components/ui/card";
import type { InteractionWithRelations } from "@/lib/interactions";

const tabButtonBase =
  "rounded-full px-3 py-1 text-sm font-medium transition-colors";

const tabsByLocale = {
  ru: [
    "Обзор",
    "Таймлайн",
    "Needs/Offers",
    "Обязательства",
    "Граф",
    "Сообщества",
  ],
  en: [
    "Overview",
    "Timeline",
    "Needs/Offers",
    "Commitments",
    "Graph",
    "Communities",
  ],
};

type ContactProfileTabsProps = {
  locale: "ru" | "en";
  interactions: TimelineInteraction[];
  commitments: CommitmentCardData[];
};

export type TimelineInteraction = InteractionWithRelations & {
  participantNames: string[];
};

const typeLabels: Record<
  TimelineInteraction["interactionType"],
  { ru: string; en: string }
> = {
  meeting: { ru: "Встреча", en: "Meeting" },
  call: { ru: "Созвон", en: "Call" },
  message: { ru: "Сообщение", en: "Message" },
  email: { ru: "Email", en: "Email" },
  note: { ru: "Заметка", en: "Note" },
  event: { ru: "Событие", en: "Event" },
};

const privacyLabels: Record<
  TimelineInteraction["privacyLevel"],
  { ru: string; en: string }
> = {
  workspace: { ru: "Команда", en: "Workspace" },
  private: { ru: "Приватно", en: "Private" },
  restricted: { ru: "Ограничено", en: "Restricted" },
};

const statusLabels: Record<
  NonNullable<TimelineInteraction["followups"][number]>["status"],
  { ru: string; en: string }
> = {
  open: { ru: "Открыто", en: "Open" },
  done: { ru: "Выполнено", en: "Done" },
  snoozed: { ru: "Отложено", en: "Snoozed" },
};

export function ContactProfileTabs({
  locale,
  interactions,
  commitments,
}: ContactProfileTabsProps) {
  const tabs = tabsByLocale[locale];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const emptyCopy =
    locale === "ru"
      ? "Пока нет данных в этом разделе."
      : "No data in this section yet.";
  const timelineLabel = locale === "ru" ? "Таймлайн" : "Timeline";
  const commitmentsLabel = locale === "ru" ? "Обязательства" : "Commitments";

  let content = (
    <div className="text-sm text-slate-600">
      {emptyCopy} <span className="text-slate-400">({activeTab})</span>
    </div>
  );

  if (activeTab === timelineLabel) {
    content =
      interactions.length === 0 ? (
        <div className="text-sm text-slate-600">
          {locale === "ru"
            ? "Пока нет взаимодействий."
            : "No interactions yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {interactions.map((interaction) => {
            const occurredAt = new Date(interaction.occurredAt);
            const dateLabel = occurredAt.toLocaleDateString(
              locale === "ru" ? "ru-RU" : "en-US",
              { year: "numeric", month: "short", day: "numeric" }
            );
            return (
              <div
                key={interaction.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                    {typeLabels[interaction.interactionType][locale]}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                    {privacyLabels[interaction.privacyLevel][locale]}
                  </span>
                  <span>{dateLabel}</span>
                </div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  {interaction.subject}
                </div>
                {interaction.summary && (
                  <p className="mt-1 text-sm text-slate-600">
                    {interaction.summary}
                  </p>
                )}
                {interaction.participantNames.length > 0 && (
                  <div className="mt-3 text-sm text-slate-600">
                    <span className="font-medium text-slate-700">
                      {locale === "ru" ? "Участники:" : "Participants:"}
                    </span>{" "}
                    {interaction.participantNames.join(", ")}
                  </div>
                )}
                {(interaction.organizations.length > 0 ||
                  interaction.communities.length > 0) && (
                  <div className="mt-2 text-sm text-slate-600">
                    {interaction.organizations.length > 0 && (
                      <div>
                        <span className="font-medium text-slate-700">
                          {locale === "ru" ? "Организации:" : "Organizations:"}
                        </span>{" "}
                        {interaction.organizations.join(", ")}
                      </div>
                    )}
                    {interaction.communities.length > 0 && (
                      <div>
                        <span className="font-medium text-slate-700">
                          {locale === "ru" ? "Сообщества:" : "Communities:"}
                        </span>{" "}
                        {interaction.communities.join(", ")}
                      </div>
                    )}
                  </div>
                )}
                {interaction.links.length > 0 && (
                  <div className="mt-2 text-sm text-slate-600">
                    <span className="font-medium text-slate-700">
                      {locale === "ru" ? "Ссылки:" : "Links:"}
                    </span>{" "}
                    {interaction.links.map((link) => link.label ?? link.url).join(", ")}
                  </div>
                )}
                {interaction.followups.length > 0 && (
                  <div className="mt-4 space-y-2 rounded-md bg-slate-50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {locale === "ru" ? "Follow-ups" : "Follow-ups"}
                    </div>
                    {interaction.followups.map((followup) => (
                      <div
                        key={followup.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600"
                      >
                        <div>
                          <span className="font-medium text-slate-700">
                            {statusLabels[followup.status][locale]}
                          </span>
                          {followup.dueAt && (
                            <span className="ml-2 text-slate-500">
                              {new Date(followup.dueAt).toLocaleDateString(
                                locale === "ru" ? "ru-RU" : "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            </span>
                          )}
                          {followup.notes && (
                            <span className="ml-2">• {followup.notes}</span>
                          )}
                        </div>
                        {followup.assignedToUserId && (
                          <div className="text-xs text-slate-500">
                            {locale === "ru" ? "Ответственный:" : "Owner:"}{" "}
                            {followup.assignedToUserId}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
  }

  if (activeTab === commitmentsLabel) {
    content =
      commitments.length === 0 ? (
        <div className="text-sm text-slate-600">
          {locale === "ru"
            ? "Нет обязательств для этого контакта."
            : "No commitments for this contact yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {commitments.map((commitment) => (
            <CommitmentCard
              key={commitment.id}
              locale={locale}
              commitment={commitment}
            />
          ))}
        </div>
      );
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`${tabButtonBase} ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>
      <div>{content}</div>
    </Card>
  );
}
