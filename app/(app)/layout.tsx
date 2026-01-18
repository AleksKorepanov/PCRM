import { headers } from "next/headers";

import { AppShell } from "@/components/shell/app-shell";
import { getShellContext } from "@/lib/shell-data";
import { getText, resolveLocale } from "@/lib/text";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = resolveLocale(headers().get("accept-language"));
  const text = getText(locale);
  const shell = getShellContext();

  return (
    <AppShell text={text} {...shell}>
      {children}
    </AppShell>
  );
}
