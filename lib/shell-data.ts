import { Role } from "@/lib/store";

export type ShellUser = {
  name: string;
  email: string;
  role: Role;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
};

export type ShellContext = {
  user: ShellUser;
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string;
};

export function getShellContext(): ShellContext {
  const workspaces: WorkspaceSummary[] = [
    { id: "ws-north", name: "Северная команда" },
    { id: "ws-partners", name: "Партнерская сеть" },
    { id: "ws-research", name: "Исследовательский трек" },
  ];

  return {
    user: {
      name: "Виктория Алексеева",
      email: "victoria@pcrm.local",
      role: "member",
    },
    workspaces,
    activeWorkspaceId: workspaces[0]?.id ?? "",
  };
}
