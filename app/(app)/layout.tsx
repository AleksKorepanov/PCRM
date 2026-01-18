import { AppShell } from "@/components/shell/app-shell";
import { getUserLocale } from "@/lib/locale";
import { getShellContext } from "@/lib/shell-data";
import { getText } from "@/lib/text";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getUserLocale();
  const text = getText(locale);
  const shell = getShellContext();

  return (
    <AppShell text={text} {...shell}>
      {children}
    </AppShell>
  );
}
