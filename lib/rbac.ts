import { Role } from "@/lib/store";

export const roles: Role[] = [
  "owner",
  "admin",
  "member",
  "assistant",
  "read-only",
];

const rolePriority: Record<Role, number> = {
  owner: 5,
  admin: 4,
  member: 3,
  assistant: 2,
  "read-only": 1,
};

export function isValidRole(role: string): role is Role {
  return roles.includes(role as Role);
}

export function roleAtLeast(role: Role, minimum: Role): boolean {
  return rolePriority[role] >= rolePriority[minimum];
}

export function canInviteMembers(role: Role): boolean {
  return roleAtLeast(role, "admin");
}

export function canChangeRoles(role: Role): boolean {
  return roleAtLeast(role, "admin");
}

export function canViewAudit(role: Role): boolean {
  return role === "owner" || role === "admin" || role === "assistant";
}

export function canAccessWorkspace(role: Role): boolean {
  return roleAtLeast(role, "read-only");
}

export function canCreateRecords(role: Role): boolean {
  return roleAtLeast(role, "member");
}

export function canEditContacts(role: Role): boolean {
  return roleAtLeast(role, "assistant");
}

export function canCreateInteractions(role: Role): boolean {
  return roleAtLeast(role, "member");
}

export function canEditInteractions(role: Role): boolean {
  return roleAtLeast(role, "assistant");
}

export function canCoordinateIntroductions(role: Role): boolean {
  return roleAtLeast(role, "assistant");
}

export function canManageNeedsOffers(role: Role): boolean {
  return roleAtLeast(role, "assistant");
}

export function canManageCommitments(role: Role): boolean {
  return roleAtLeast(role, "assistant");
}

export function canManageCommunities(role: Role): boolean {
  return roleAtLeast(role, "assistant");
}

export function canRunResearch(role: Role): boolean {
  return roleAtLeast(role, "member");
}

export function canViewAnalytics(role: Role): boolean {
  return roleAtLeast(role, "admin");
}

export function canManageSettings(role: Role): boolean {
  return roleAtLeast(role, "admin");
}
