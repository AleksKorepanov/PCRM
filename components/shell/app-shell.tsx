import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  canInviteMembers,
  canManageSettings,
  roleAtLeast,
} from "@/lib/rbac";
import { ShellContext } from "@/lib/shell-data";
import { TextCopy } from "@/lib/text";

type NavItem = {
  key: keyof TextCopy["nav"];
  href: string;
  minRole: "owner" | "admin" | "member" | "assistant" | "read-only";
  hideIfRestricted?: boolean;
};

const navItems: NavItem[] = [
  { key: "dashboard", href: "/dashboard", minRole: "read-only" },
  { key: "contacts", href: "/contacts", minRole: "read-only" },
  { key: "orgs", href: "/orgs", minRole: "read-only" },
  { key: "communities", href: "/communities", minRole: "read-only" },
  { key: "needsOffers", href: "/needs-offers", minRole: "assistant" },
  { key: "introductions", href: "/introductions", minRole: "assistant" },
  { key: "commitments", href: "/commitments", minRole: "assistant" },
  { key: "research", href: "/research", minRole: "member" },
  { key: "analytics", href: "/analytics", minRole: "admin" },
  {
    key: "settings",
    href: "/settings",
    minRole: "admin",
    hideIfRestricted: true,
  },
];

type AppShellProps = ShellContext & {
  text: TextCopy;
  children: React.ReactNode;
};

export function AppShell({
  text,
  user,
  workspaces,
  activeWorkspaceId,
  children,
}: AppShellProps) {
  const canInvite = canInviteMembers(user.role);
  const canManageWorkspace = canManageSettings(user.role);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-sm font-semibold text-white">
              {text.appName}
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
                {text.workspaceSwitcherLabel}
              </p>
              <label className="flex flex-col text-sm font-medium text-slate-900">
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                  defaultValue={activeWorkspaceId}
                  aria-label={text.workspaceSwitcherHelper}
                >
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">
                {text.roleLabels[user.role]}
              </p>
            </div>
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                {text.userMenuLabel}
              </summary>
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
                <div className="space-y-1 border-b border-slate-200 pb-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {text.userMenuDescription}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {user.email}
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-3">
                  <Button
                    variant="secondary"
                    className="w-full justify-start px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!canInvite}
                    title={!canInvite ? text.actions.accessRestricted : undefined}
                  >
                    {text.actions.inviteMembers}
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!canManageWorkspace}
                    title={!canManageWorkspace ? text.actions.accessRestricted : undefined}
                  >
                    {text.actions.manageWorkspace}
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start px-3 text-sm"
                  >
                    {text.actions.viewProfile}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-3 text-sm"
                  >
                    {text.actions.signOut}
                  </Button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-8">
        <aside className="hidden w-56 flex-col gap-2 md:flex">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const canAccess = roleAtLeast(user.role, item.minRole);
              if (!canAccess && item.hideIfRestricted) {
                return null;
              }
              const label = text.nav[item.key];
              return canAccess ? (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <span>{label}</span>
                </Link>
              ) : (
                <span
                  key={item.key}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-400"
                  aria-disabled="true"
                  title={text.actions.accessRestricted}
                >
                  <span>{label}</span>
                  <span aria-hidden>🔒</span>
                </span>
              );
            })}
          </nav>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
            <p className="font-semibold text-slate-900">{text.appName}</p>
            <p>{text.shell.roleAwareNavNote}</p>
          </div>
        </aside>
        <main className="flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}
