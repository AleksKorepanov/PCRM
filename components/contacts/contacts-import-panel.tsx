"use client";

import { useMemo, useState } from "react";

import {
  buildCsvPreview,
  buildVCardPreview,
  CsvFieldKey,
  CsvMapping,
  parseCsv,
  parseVCard,
} from "@/lib/contacts-import";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

type ContactsImportPanelProps = {
  locale: "ru" | "en";
  workspaceId: string;
  canEdit: boolean;
};

const inputClassName =
  "mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none";

const labelClassName = "text-xs font-medium uppercase tracking-wide text-slate-500";

const csvFields: { key: CsvFieldKey; label: { ru: string; en: string } }[] = [
  { key: "name", label: { ru: "Имя", en: "Name" } },
  { key: "email", label: { ru: "Email", en: "Email" } },
  { key: "phone", label: { ru: "Телефон", en: "Phone" } },
  { key: "city", label: { ru: "Город", en: "City" } },
  { key: "tier", label: { ru: "Тир", en: "Tier" } },
  { key: "trustScore", label: { ru: "Индекс доверия", en: "Trust score" } },
  { key: "introducedBy", label: { ru: "Кем представлен", en: "Introduced by" } },
  { key: "aliases", label: { ru: "Алиасы", en: "Aliases" } },
  { key: "tags", label: { ru: "Теги", en: "Tags" } },
  { key: "organizations", label: { ru: "Организации", en: "Organizations" } },
  { key: "communities", label: { ru: "Сообщества", en: "Communities" } },
];

function suggestMapping(headers: string[]): CsvMapping {
  const mapping: CsvMapping = {};
  headers.forEach((header) => {
    const normalized = header.trim().toLowerCase();
    if (["name", "full name", "fullname", "имя", "фио"].includes(normalized)) {
      mapping.name = header;
    }
    if (["email", "e-mail", "почта"].includes(normalized)) {
      mapping.email = header;
    }
    if (["phone", "телефон", "mobile"].includes(normalized)) {
      mapping.phone = header;
    }
    if (["city", "город"].includes(normalized)) {
      mapping.city = header;
    }
    if (["tier", "тир"].includes(normalized)) {
      mapping.tier = header;
    }
    if (["trustscore", "trust score", "индекс доверия"].includes(normalized)) {
      mapping.trustScore = header;
    }
    if (["introduced by", "introducedby", "кем представлен"].includes(normalized)) {
      mapping.introducedBy = header;
    }
    if (["aliases", "aliase", "алиасы"].includes(normalized)) {
      mapping.aliases = header;
    }
    if (["tags", "теги"].includes(normalized)) {
      mapping.tags = header;
    }
    if (["organization", "организация", "company"].includes(normalized)) {
      mapping.organizations = header;
    }
    if (["community", "сообщество"].includes(normalized)) {
      mapping.communities = header;
    }
  });
  return mapping;
}

export function ContactsImportPanel({
  locale,
  workspaceId,
  canEdit,
}: ContactsImportPanelProps) {
  const copy =
    locale === "ru"
      ? {
          title: "Импорт контактов",
          csvTab: "CSV",
          vcardTab: "vCard",
          upload: "Загрузить файл",
          mapping: "Сопоставление полей",
          preview: "Предпросмотр",
          summary: "Сводка",
          import: "Импортировать",
          imported: "Импортировано",
          skipped: "Пропущено",
          errors: "Ошибки",
          empty: "Загрузите файл для импорта",
          disabled: "Импорт доступен с роли ассистента",
        }
      : {
          title: "Import contacts",
          csvTab: "CSV",
          vcardTab: "vCard",
          upload: "Upload file",
          mapping: "Field mapping",
          preview: "Preview",
          summary: "Summary",
          import: "Import",
          imported: "Imported",
          skipped: "Skipped",
          errors: "Errors",
          empty: "Upload a file to import",
          disabled: "Import is available starting from assistant role",
        };

  const [mode, setMode] = useState<"csv" | "vcard">("csv");
  const [csvText, setCsvText] = useState("");
  const [vcardText, setVcardText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<CsvMapping>({});
  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    skipped: number;
  } | null>(null);

  const preview = useMemo(() => {
    if (mode === "csv" && csvText) {
      const parsed = parseCsv(csvText);
      return buildCsvPreview(parsed, mapping);
    }
    if (mode === "vcard" && vcardText) {
      const drafts = parseVCard(vcardText);
      return buildVCardPreview(drafts);
    }
    return null;
  }, [csvText, mapping, mode, vcardText]);

  const handleFile = async (file?: File | null) => {
    if (!file) {
      return;
    }
    const text = await file.text();
    if (mode === "csv") {
      const parsed = parseCsv(text);
      setCsvText(text);
      setHeaders(parsed.headers);
      setMapping((current) => (Object.keys(current).length ? current : suggestMapping(parsed.headers)));
    } else {
      setVcardText(text);
    }
    setImportSummary(null);
  };

  const runImport = async () => {
    if (!canEdit) {
      return;
    }
    if (mode === "csv" && !csvText) {
      return;
    }
    if (mode === "vcard" && !vcardText) {
      return;
    }
    const response = await fetch("/api/contacts/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        type: mode,
        content: mode === "csv" ? csvText : vcardText,
        mapping,
        action: "import",
      }),
    });
    if (!response.ok) {
      setImportSummary(null);
      return;
    }
    const payload = (await response.json()) as {
      summary?: { total: number; imported: number; skipped: number };
    };
    if (payload.summary) {
      setImportSummary(payload.summary);
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">{copy.title}</div>
        {!canEdit ? (
          <span className="text-xs text-slate-500">{copy.disabled}</span>
        ) : null}
      </div>
      <div className="flex gap-2 text-sm">
        {[{ key: "csv", label: copy.csvTab }, { key: "vcard", label: copy.vcardTab }].map(
          (tab) => (
            <button
              key={tab.key}
              type="button"
              className={cn(
                "rounded-full border px-3 py-1",
                mode === tab.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200"
              )}
              onClick={() => setMode(tab.key as "csv" | "vcard")}
            >
              {tab.label}
            </button>
          )
        )}
      </div>
      <div>
        <label className="space-y-1 text-sm text-slate-700">
          <span className={labelClassName}>{copy.upload}</span>
          <input
            className={inputClassName}
            type="file"
            accept={mode === "csv" ? ".csv,text/csv" : ".vcf,text/vcard"}
            disabled={!canEdit}
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
      </div>

      {mode === "csv" && headers.length > 0 ? (
        <div className="space-y-2">
          <div className={labelClassName}>{copy.mapping}</div>
          <div className="grid gap-2">
            {csvFields.map((field) => (
              <label key={field.key} className="text-sm text-slate-700">
                <span className="text-xs text-slate-500">
                  {field.label[locale]}
                </span>
                <select
                  className={inputClassName}
                  value={mapping[field.key] ?? ""}
                  disabled={!canEdit}
                  onChange={(event) =>
                    setMapping((current) => ({
                      ...current,
                      [field.key]: event.target.value || undefined,
                    }))
                  }
                >
                  <option value="">—</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <div className={labelClassName}>{copy.preview}</div>
        {!preview ? (
          <div className="text-sm text-slate-500">{copy.empty}</div>
        ) : (
          <div className="space-y-2 text-sm text-slate-700">
            <div className="rounded-md border border-slate-200 p-3">
              <div className="text-xs text-slate-500">{copy.summary}</div>
              <div className="mt-1 flex flex-wrap gap-4 text-sm">
                <span>
                  {preview.summary.total} rows
                </span>
                <span className="text-emerald-600">{preview.summary.valid} valid</span>
                <span className="text-rose-600">{preview.summary.invalid} invalid</span>
              </div>
            </div>
            <div className="grid gap-2">
              {preview.rows.slice(0, 5).map((row) => (
                <div key={row.index} className="rounded-md border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Row {row.index}</div>
                  <div className="mt-1 font-medium text-slate-900">
                    {row.contact.name ?? "—"}
                  </div>
                  <div className="text-xs text-slate-600">
                    {row.contact.channels?.map((channel) => channel.value).join(", ") || "—"}
                  </div>
                  {row.errors.length > 0 ? (
                    <div className="mt-2 text-xs text-rose-600">
                      {copy.errors}: {row.errors.join(", ")}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {importSummary ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {copy.imported}: {importSummary.imported}. {copy.skipped}: {importSummary.skipped}.
        </div>
      ) : null}

      <Button
        className="w-full"
        disabled={!canEdit || !preview || preview.summary.valid === 0}
        onClick={runImport}
      >
        {copy.import}
      </Button>
    </Card>
  );
}
