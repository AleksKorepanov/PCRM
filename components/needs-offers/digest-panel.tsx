"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  buildWeeklyDigestText,
  DigestData,
  DigestTemplates,
} from "@/lib/needs-offers-digest";

const copyLabels = {
  ru: {
    title: "Еженедельный дайджест",
    copy: "Скопировать",
    copied: "Скопировано",
    templateTitle: "Шаблон текста",
    headerLabel: "Заголовок",
    footerLabel: "Подпись",
    save: "Сохранить шаблон",
    saving: "Сохраняем...",
    saved: "Сохранено",
    error: "Ошибка сохранения",
  },
  en: {
    title: "Weekly digest",
    copy: "Copy",
    copied: "Copied",
    templateTitle: "Template settings",
    headerLabel: "Header",
    footerLabel: "Footer",
    save: "Save template",
    saving: "Saving...",
    saved: "Saved",
    error: "Save failed",
  },
};

export function DigestPanel({
  locale,
  workspaceId,
  data,
  templates: initialTemplates,
}: {
  locale: "ru" | "en";
  workspaceId: string;
  data: DigestData;
  templates: DigestTemplates;
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const digestRu = useMemo(
    () =>
      buildWeeklyDigestText({
        locale: "ru",
        templates,
        data,
      }),
    [templates, data]
  );
  const digestEn = useMemo(
    () =>
      buildWeeklyDigestText({
        locale: "en",
        templates,
        data,
      }),
    [templates, data]
  );

  const labels = copyLabels[locale];

  const handleCopy = async (value: string) => {
    if (!navigator.clipboard) {
      setStatus(labels.error);
      return;
    }
    await navigator.clipboard.writeText(value);
    setStatus(labels.copied);
  };

  const handleSave = () => {
    startTransition(async () => {
      const response = await fetch("/api/needs-offers/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, templates }),
      });
      if (!response.ok) {
        setStatus(labels.error);
        return;
      }
      setStatus(labels.saved);
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">RU</div>
          <Button variant="secondary" onClick={() => handleCopy(digestRu)}>
            {labels.copy}
          </Button>
        </div>
        <textarea
          className="h-64 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700"
          readOnly
          value={digestRu}
        />
      </Card>
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">EN</div>
          <Button variant="secondary" onClick={() => handleCopy(digestEn)}>
            {labels.copy}
          </Button>
        </div>
        <textarea
          className="h-64 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700"
          readOnly
          value={digestEn}
        />
      </Card>
      <Card className="space-y-4 lg:col-span-2">
        <div className="text-sm font-semibold text-slate-900">{labels.templateTitle}</div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-500">RU</div>
            <label className="block text-xs text-slate-500">
              {labels.headerLabel}
              <textarea
                className="mt-2 h-20 w-full resize-none rounded-xl border border-slate-200 p-2 text-xs text-slate-700"
                value={templates.ru.header}
                onChange={(event) =>
                  setTemplates((prev) => ({
                    ...prev,
                    ru: { ...prev.ru, header: event.target.value },
                  }))
                }
              />
            </label>
            <label className="block text-xs text-slate-500">
              {labels.footerLabel}
              <textarea
                className="mt-2 h-20 w-full resize-none rounded-xl border border-slate-200 p-2 text-xs text-slate-700"
                value={templates.ru.footer}
                onChange={(event) =>
                  setTemplates((prev) => ({
                    ...prev,
                    ru: { ...prev.ru, footer: event.target.value },
                  }))
                }
              />
            </label>
          </div>
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-500">EN</div>
            <label className="block text-xs text-slate-500">
              {labels.headerLabel}
              <textarea
                className="mt-2 h-20 w-full resize-none rounded-xl border border-slate-200 p-2 text-xs text-slate-700"
                value={templates.en.header}
                onChange={(event) =>
                  setTemplates((prev) => ({
                    ...prev,
                    en: { ...prev.en, header: event.target.value },
                  }))
                }
              />
            </label>
            <label className="block text-xs text-slate-500">
              {labels.footerLabel}
              <textarea
                className="mt-2 h-20 w-full resize-none rounded-xl border border-slate-200 p-2 text-xs text-slate-700"
                value={templates.en.footer}
                onChange={(event) =>
                  setTemplates((prev) => ({
                    ...prev,
                    en: { ...prev.en, footer: event.target.value },
                  }))
                }
              />
            </label>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? labels.saving : labels.save}
          </Button>
          {status && <span className="text-xs text-slate-500">{status}</span>}
        </div>
      </Card>
    </div>
  );
}
