"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Locale } from "@/lib/text";

const localeValues: Locale[] = ["ru", "en"];

type LocalePreferenceProps = {
  initialLocale: Locale;
  title: string;
  description: string;
  label: string;
  saveLabel: string;
  savingLabel: string;
  savedLabel: string;
  errorLabel: string;
  localeOptions: {
    ru: string;
    en: string;
  };
};

export function LocalePreference({
  initialLocale,
  title,
  description,
  label,
  saveLabel,
  savingLabel,
  savedLabel,
  errorLabel,
  localeOptions,
}: LocalePreferenceProps) {
  const [selectedLocale, setSelectedLocale] = useState<Locale>(initialLocale);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  const handleChange = (value: string) => {
    if (localeValues.includes(value as Locale)) {
      setSelectedLocale(value as Locale);
      setStatus("idle");
    }
  };

  const handleSave = async () => {
    setStatus("saving");
    try {
      const response = await fetch("/api/users/locale", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: selectedLocale }),
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      const data = (await response.json()) as { locale?: Locale };
      if (data.locale && localeValues.includes(data.locale)) {
        setSelectedLocale(data.locale);
      }
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  const statusLabel =
    status === "saving"
      ? savingLabel
      : status === "saved"
        ? savedLabel
        : status === "error"
          ? errorLabel
          : "";

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </CardHeader>
      <CardContent>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          <span>{label}</span>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
            value={selectedLocale}
            onChange={(event) => handleChange(event.target.value)}
          >
            <option value="ru">{localeOptions.ru}</option>
            <option value="en">{localeOptions.en}</option>
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={status === "saving"}
            className="disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? savingLabel : saveLabel}
          </Button>
          <span className="text-sm text-slate-500" aria-live="polite">
            {statusLabel}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
