"use client";

import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";

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
};

export function ContactProfileTabs({ locale }: ContactProfileTabsProps) {
  const tabs = tabsByLocale[locale];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const emptyCopy =
    locale === "ru"
      ? "Пока нет данных в этом разделе."
      : "No data in this section yet.";

  const content = useMemo(() => {
    return (
      <div className="text-sm text-slate-600">
        {emptyCopy} <span className="text-slate-400">({activeTab})</span>
      </div>
    );
  }, [activeTab, emptyCopy]);

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
