"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Locale, getText, resolveLocale } from "@/lib/text";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("PCRM shell error", error);
  }, [error]);

  const [locale, setLocale] = useState<Locale>("ru");

  useEffect(() => {
    let active = true;
    fetch("/api/users/locale")
      .then(async (response) => {
        if (!response.ok) {
          return undefined;
        }
        return (await response.json()) as { locale?: string };
      })
      .then((payload) => {
        if (!active || !payload?.locale) {
          return;
        }
        setLocale(resolveLocale(payload.locale));
      })
      .catch(() => {
        if (active) {
          setLocale("ru");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const text = useMemo(() => getText(locale), [locale]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-start justify-center gap-4 rounded-2xl border border-red-200 bg-white p-8">
      <p className="text-sm font-semibold text-red-500">
        {text.errors.shellKicker}
      </p>
      <h1 className="text-2xl font-semibold text-slate-900">
        {text.errors.shellTitle}
      </h1>
      <p className="text-sm text-slate-600">{text.errors.shellDescription}</p>
      <Button onClick={reset}>{text.errors.shellAction}</Button>
    </div>
  );
}
