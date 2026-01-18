import { randomUUID } from "crypto";

export type Role = "owner" | "admin" | "member" | "assistant" | "read-only";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
};

export type Session = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  activeWorkspaceId?: string;
};

export type Workspace = {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
};

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  joinedAt: string;
};

export type WorkspaceInvite = {
  id: string;
  workspaceId: string;
  email: string;
  role: Role;
  token: string;
  createdAt: string;
  invitedBy: string;
  acceptedAt?: string;
};

export type AuditLog = {
  id: string;
  workspaceId: string;
  actorUserId: string | null;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type Store = {
  users: Map<string, User>;
  sessions: Map<string, Session>;
  workspaces: Map<string, Workspace>;
  members: Map<string, WorkspaceMember>;
  invites: Map<string, WorkspaceInvite>;
  auditLogs: Map<string, AuditLog>;
};

const storeKey = Symbol.for("pcrm.store");

function initializeStore(): Store {
  return {
    users: new Map(),
    sessions: new Map(),
    workspaces: new Map(),
    members: new Map(),
    invites: new Map(),
    auditLogs: new Map(),
  };
}

function getStore(): Store {
  const globalStore = globalThis as Record<string | symbol, Store | undefined>;
  if (!globalStore[storeKey]) {
    globalStore[storeKey] = initializeStore();
  }
  return globalStore[storeKey]!;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createUser(params: {
  email: string;
  passwordHash: string;
  passwordSalt: string;
}): User {
  const store = getStore();
  const user: User = {
    id: randomUUID(),
    email: params.email,
    passwordHash: params.passwordHash,
    passwordSalt: params.passwordSalt,
    createdAt: nowIso(),
  };
  store.users.set(user.id, user);
  return user;
}

export function findUserByEmail(email: string): User | undefined {
  const store = getStore();
  return Array.from(store.users.values()).find((user) => user.email === email);
}

export function findUserById(userId: string): User | undefined {
  const store = getStore();
  return store.users.get(userId);
}

export function createSession(userId: string, ttlDays = 7): Session {
  const store = getStore();
  const createdAt = nowIso();
  const expiresAt = new Date(
    Date.now() + ttlDays * 24 * 60 * 60 * 1000
  ).toISOString();
  const session: Session = {
    token: randomUUID(),
    userId,
    createdAt,
    expiresAt,
  };
  store.sessions.set(session.token, session);
  return session;
}

export function getSession(token: string): Session | undefined {
  const store = getStore();
  const session = store.sessions.get(token);
  if (!session) {
    return undefined;
  }
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    store.sessions.delete(token);
    return undefined;
  }
  return session;
}

export function deleteSession(token: string): void {
  const store = getStore();
  store.sessions.delete(token);
}

export function updateSessionActiveWorkspace(
  token: string,
  workspaceId: string
): Session | undefined {
  const store = getStore();
  const session = store.sessions.get(token);
  if (!session) {
    return undefined;
  }
  session.activeWorkspaceId = workspaceId;
  store.sessions.set(token, session);
  return session;
}

export function createWorkspace(params: {
  name: string;
  createdBy: string;
}): Workspace {
  const store = getStore();
  const workspace: Workspace = {
    id: randomUUID(),
    name: params.name,
    createdAt: nowIso(),
    createdBy: params.createdBy,
  };
  store.workspaces.set(workspace.id, workspace);
  return workspace;
}

export function getWorkspaceById(workspaceId: string): Workspace | undefined {
  const store = getStore();
  return store.workspaces.get(workspaceId);
}

export function listWorkspacesForUser(userId: string): Workspace[] {
  const store = getStore();
  const memberWorkspaceIds = new Set(
    Array.from(store.members.values())
      .filter((member) => member.userId === userId)
      .map((member) => member.workspaceId)
  );
  return Array.from(store.workspaces.values()).filter((workspace) =>
    memberWorkspaceIds.has(workspace.id)
  );
}

export function addMember(params: {
  workspaceId: string;
  userId: string;
  role: Role;
}): WorkspaceMember {
  const store = getStore();
  const member: WorkspaceMember = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    userId: params.userId,
    role: params.role,
    joinedAt: nowIso(),
  };
  store.members.set(member.id, member);
  return member;
}

export function getMembership(
  workspaceId: string,
  userId: string
): WorkspaceMember | undefined {
  const store = getStore();
  return Array.from(store.members.values()).find(
    (member) =>
      member.workspaceId === workspaceId && member.userId === userId
  );
}

export function listMembersForWorkspace(
  workspaceId: string
): WorkspaceMember[] {
  const store = getStore();
  return Array.from(store.members.values()).filter(
    (member) => member.workspaceId === workspaceId
  );
}

export function updateMemberRole(
  memberId: string,
  role: Role
): WorkspaceMember | undefined {
  const store = getStore();
  const member = store.members.get(memberId);
  if (!member) {
    return undefined;
  }
  const updated = { ...member, role };
  store.members.set(memberId, updated);
  return updated;
}

export function createInvite(params: {
  workspaceId: string;
  email: string;
  role: Role;
  invitedBy: string;
  token: string;
}): WorkspaceInvite {
  const store = getStore();
  const invite: WorkspaceInvite = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    email: params.email,
    role: params.role,
    token: params.token,
    createdAt: nowIso(),
    invitedBy: params.invitedBy,
  };
  store.invites.set(invite.id, invite);
  return invite;
}

export function findInviteByToken(
  workspaceId: string,
  token: string
): WorkspaceInvite | undefined {
  const store = getStore();
  return Array.from(store.invites.values()).find(
    (invite) =>
      invite.workspaceId === workspaceId && invite.token === token
  );
}

export function acceptInvite(inviteId: string): WorkspaceInvite | undefined {
  const store = getStore();
  const invite = store.invites.get(inviteId);
  if (!invite) {
    return undefined;
  }
  const updated = { ...invite, acceptedAt: nowIso() };
  store.invites.set(inviteId, updated);
  return updated;
}

export function addAuditLog(params: {
  workspaceId: string;
  actorUserId: string | null;
  action: string;
  metadata: Record<string, unknown>;
}): AuditLog {
  const store = getStore();
  const log: AuditLog = {
    id: randomUUID(),
    workspaceId: params.workspaceId,
    actorUserId: params.actorUserId,
    action: params.action,
    metadata: params.metadata,
    createdAt: nowIso(),
  };
  store.auditLogs.set(log.id, log);
  return log;
}

export function listAuditLogs(workspaceId: string): AuditLog[] {
  const store = getStore();
  return Array.from(store.auditLogs.values()).filter(
    (log) => log.workspaceId === workspaceId
  );
}
