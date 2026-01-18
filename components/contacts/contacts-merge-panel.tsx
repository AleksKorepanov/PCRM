"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Contact } from "@/lib/contacts";
import { DedupeSuggestion } from "@/lib/contacts-dedupe";
import { cn } from "@/lib/cn";

type ContactsMergePanelProps = {
  locale: "ru" | "en";
  workspaceId: string;
  canEdit: boolean;
  contacts: Contact[];
};

const inputClassName =
  "mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none";

const labelClassName = "text-xs font-medium uppercase tracking-wide text-slate-500";

const mergeFields = [
  { key: "name", label: { ru: "Имя", en: "Name" } },
  { key: "city", label: { ru: "Город", en: "City" } },
  { key: "tier", label: { ru: "Тир", en: "Tier" } },
  { key: "trustScore", label: { ru: "Индекс доверия", en: "Trust score" } },
  { key: "introducedBy", label: { ru: "Кем представлен", en: "Introduced by" } },
] as const;

export function ContactsMergePanel({
  locale,
  workspaceId,
  canEdit,
  contacts,
}: ContactsMergePanelProps) {
  const copy =
    locale === "ru"
      ? {
          title: "Дедупликация и слияние",
          survivor: "Основной контакт",
          sources: "Кандидаты на слияние",
          fieldPick: "Выбор поля",
          merge: "Слить",
          dedupe: "Найти дубликаты",
          suggestions: "Предложения",
          empty: "Дубликаты не найдены",
          disabled: "Слияние доступно с роли ассистента",
          merged: "Контакты объединены",
        }
      : {
          title: "Dedupe & merge",
          survivor: "Survivor",
          sources: "Merge candidates",
          fieldPick: "Field choice",
          merge: "Merge",
          dedupe: "Find duplicates",
          suggestions: "Suggestions",
          empty: "No duplicates found",
          disabled: "Merge is available starting from assistant role",
          merged: "Contacts merged",
        };

  const [survivorId, setSurvivorId] = useState<string>("");
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<DedupeSuggestion[]>([]);
  const [mergedNotice, setMergedNotice] = useState("");

  const selectableSources = useMemo(
    () => contacts.filter((contact) => contact.id !== survivorId),
    [contacts, survivorId]
  );

  const updateSource = (contactId: string) => {
    setSourceIds((current) =>
      current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId]
    );
  };

  const runDedupe = async () => {
    const response = await fetch(`/api/contacts/dedupe?workspaceId=${workspaceId}`);
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as { suggestions?: DedupeSuggestion[] };
    setSuggestions(payload.suggestions ?? []);
  };

  const runMerge = async () => {
    if (!canEdit || !survivorId || sourceIds.length === 0) {
      return;
    }
    const response = await fetch("/api/contacts/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        survivorId,
        sourceIds,
        selections,
      }),
    });
    if (!response.ok) {
      return;
    }
    setMergedNotice(copy.merged);
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">{copy.title}</div>
        {!canEdit ? (
          <span className="text-xs text-slate-500">{copy.disabled}</span>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm text-slate-700">
          <span className={labelClassName}>{copy.survivor}</span>
          <select
            className={inputClassName}
            value={survivorId}
            disabled={!canEdit}
            onChange={(event) => {
              setSurvivorId(event.target.value);
              setSourceIds([]);
              setSelections({});
            }}
          >
            <option value="">—</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <div className={labelClassName}>{copy.sources}</div>
        <div className="grid gap-2">
          {selectableSources.map((contact) => (
            <label
              key={contact.id}
              className={cn(
                "flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm",
                sourceIds.includes(contact.id) ? "border-slate-900 bg-slate-50" : "bg-white"
              )}
            >
              <input
                type="checkbox"
                checked={sourceIds.includes(contact.id)}
                disabled={!canEdit || !survivorId}
                onChange={() => updateSource(contact.id)}
              />
              {contact.name}
            </label>
          ))}
        </div>
      </div>

      {sourceIds.length > 0 ? (
        <div className="space-y-2">
          <div className={labelClassName}>{copy.fieldPick}</div>
          <div className="grid gap-2">
            {mergeFields.map((field) => (
              <label key={field.key} className="text-sm text-slate-700">
                <span className="text-xs text-slate-500">
                  {field.label[locale]}
                </span>
                <select
                  className={inputClassName}
                  value={selections[field.key] ?? survivorId}
                  disabled={!canEdit}
                  onChange={(event) =>
                    setSelections((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                >
                  <option value={survivorId}>{copy.survivor}</option>
                  {sourceIds.map((sourceId) => {
                    const contact = contacts.find((item) => item.id === sourceId);
                    return contact ? (
                      <option key={contact.id} value={contact.id}>
                        {contact.name}
                      </option>
                    ) : null;
                  })}
                </select>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {mergedNotice ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {mergedNotice}
        </div>
      ) : null}

      <Button
        className="w-full"
        disabled={!canEdit || !survivorId || sourceIds.length === 0}
        onClick={runMerge}
      >
        {copy.merge}
      </Button>

      <div className="space-y-2">
        <Button
          className="w-full"
          variant="secondary"
          onClick={runDedupe}
        >
          {copy.dedupe}
        </Button>
        <div className={labelClassName}>{copy.suggestions}</div>
        {suggestions.length === 0 ? (
          <div className="text-sm text-slate-500">{copy.empty}</div>
        ) : (
          <div className="grid gap-2">
            {suggestions.slice(0, 5).map((suggestion) => {
              const left = contacts.find((contact) => contact.id === suggestion.contactId);
              const right = contacts.find((contact) => contact.id === suggestion.candidateId);
              return (
                <div
                  key={`${suggestion.contactId}-${suggestion.candidateId}`}
                  className="rounded-md border border-slate-200 p-3 text-sm"
                >
                  <div className="font-medium text-slate-900">
                    {left?.name ?? suggestion.contactId} ↔{" "}
                    {right?.name ?? suggestion.candidateId}
                  </div>
                  <div className="text-xs text-slate-500">
                    {suggestion.reasons.join(", ")} • Score {suggestion.score}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
