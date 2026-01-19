"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  buildIntroductionTemplatePreview,
  IntroductionTemplateTokens,
  IntroductionTemplates,
} from "@/lib/introductions";

const copyLabels = {
  ru: {
    title: "Шаблоны сообщений",
    preview: "Превью",
    templates: "Редактирование",
    save: "Сохранить шаблон",
    saving: "Сохраняем...",
    saved: "Сохранено",
    error: "Ошибка сохранения",
    requestSubject: "Тема интро",
    requestBody: "Текст интро",
    consentBody: "Запрос согласия",
    outcomeBody: "Итог интро",
  },
  en: {
    title: "Message templates",
    preview: "Preview",
    templates: "Edit templates",
    save: "Save template",
    saving: "Saving...",
    saved: "Saved",
    error: "Save failed",
    requestSubject: "Intro subject",
    requestBody: "Intro body",
    consentBody: "Consent request",
    outcomeBody: "Outcome update",
  },
};

export function IntroTemplatesPanel({
  locale,
  workspaceId,
  tokens,
  templates: initialTemplates,
}: {
  locale: "ru" | "en";
  workspaceId: string;
  tokens: IntroductionTemplateTokens;
  templates: IntroductionTemplates;
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const previewRu = useMemo(
    () =>
      buildIntroductionTemplatePreview({
        locale: "ru",
        templates,
        tokens,
      }),
    [templates, tokens]
  );
  const previewEn = useMemo(
    () =>
      buildIntroductionTemplatePreview({
        locale: "en",
        templates,
        tokens,
      }),
    [templates, tokens]
  );

  const labels = copyLabels[locale];

  const handleSave = () => {
    startTransition(async () => {
      const response = await fetch("/api/introductions/templates", {
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
        <div className="text-sm font-semibold text-slate-900">{labels.preview} RU</div>
        <textarea
          className="h-64 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700"
          readOnly
          value={previewRu}
        />
      </Card>
      <Card className="space-y-4">
        <div className="text-sm font-semibold text-slate-900">{labels.preview} EN</div>
        <textarea
          className="h-64 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700"
          readOnly
          value={previewEn}
        />
      </Card>
      <Card className="space-y-4 lg:col-span-2">
        <div className="text-sm font-semibold text-slate-900">{labels.templates}</div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-500">RU</div>
            <label className="block text-xs text-slate-500">
              {labels.requestSubject}
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-700"
                value={templates.ru.requestSubject}
                onChange={(event) =>
                  setTemplates((prev) => ({
                    ...prev,
                    ru: { ...prev.ru, requestSubject: event.target.value },
                  }))
                }
              />
            </label>
            <label className="block text-xs text-slate-500">
              {labels.requestBody}
              <textarea
                className="mt-2 h-20 w-full resize-none rounded-xl border border-slate-200 p-2 text-xs text-slate-700"
                value={templates.ru.requestBody}
                onChange={(event) =>
                  setTemplates((prev) => ({
                    ...prev,
                    ru: { ...prev.ru, requestBody: event.target.value },
                  }))
                }
              />
            </label>
            <label className="block text-xs text-slate-500">
              {labels.consentBody}
              <textarea
                className="mt-2 h-20 w-full resize-none rounded-xl border border-slate-200 p-2 text-xs text-slate-700"
                value={templates.ru.consentBody}
                onChange={(event) =>
                  setTemplates((prev) => ({
                    ...prev,
                    ru: { ...prev.ru, consentBody: event.target.value },
                  }))
                }
              />
            </label>
            <label className="block text-xs text-slate-500">
              {labels.outcomeBody}
              <textarea
                className="mt-2 h-20 w-full resize-none rounded-xl border border-slate-200 p-2 text-xs text-slate-700"
                value={templates.ru.outcomeBody}
                onChange={(event) =>
                  setTemplates((prev) => ({
                    ...prev,
                    ru: { ...prev.ru, outcomeBody: event.target.value },
                  }))
                }
              />
            </label>
          </div>
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-500">EN</div>
            <label className="block text-xs text-slate-500">
              {labels.requestSubject}
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-700"
                value={templates.en.requestSubject}
                onChange={(event) =>
                  setTemplates((prev) => ({
                    ...prev,
                    en: { ...prev.en, requestSubject: event.target.value },
                  }))
                }
              />
            </label>
            <label className="block text-xs text-slate-500">
              {labels.requestBody}
              <textarea
                className="mt-2 h-20 w-full resize-none rounded-xl border border-slate-200 p-2 text-xs text-slate-700"
                value={templates.en.requestBody}
                onChange={(event) =>
                  setTemplates((prev) => ({
                    ...prev,
                    en: { ...prev.en, requestBody: event.target.value },
                  }))
                }
              />
            </label>
            <label className="block text-xs text-slate-500">
              {labels.consentBody}
              <textarea
                className="mt-2 h-20 w-full resize-none rounded-xl border border-slate-200 p-2 text-xs text-slate-700"
                value={templates.en.consentBody}
                onChange={(event) =>
                  setTemplates((prev) => ({
                    ...prev,
                    en: { ...prev.en, consentBody: event.target.value },
                  }))
                }
              />
            </label>
            <label className="block text-xs text-slate-500">
              {labels.outcomeBody}
              <textarea
                className="mt-2 h-20 w-full resize-none rounded-xl border border-slate-200 p-2 text-xs text-slate-700"
                value={templates.en.outcomeBody}
                onChange={(event) =>
                  setTemplates((prev) => ({
                    ...prev,
                    en: { ...prev.en, outcomeBody: event.target.value },
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
