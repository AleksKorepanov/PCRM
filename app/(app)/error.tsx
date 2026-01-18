"use client";

import { useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { getText, resolveLocale } from "@/lib/text";

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

  const text = useMemo(() => {
    const locale = resolveLocale(
      typeof navigator === "undefined" ? "ru" : navigator.language
    );
    return getText(locale);
  }, []);

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
