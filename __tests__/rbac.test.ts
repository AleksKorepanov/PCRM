import {
  canChangeRoles,
  canEditContacts,
  canInviteMembers,
  canViewAudit,
  isValidRole,
  roleAtLeast,
} from "@/lib/rbac";

describe("rbac", () => {
  it("validates role names", () => {
    expect(isValidRole("owner")).toBe(true);
    expect(isValidRole("read-only")).toBe(true);
    expect(isValidRole("invalid")).toBe(false);
  });

  it("orders roles by priority", () => {
    expect(roleAtLeast("owner", "admin")).toBe(true);
    expect(roleAtLeast("member", "admin")).toBe(false);
  });

  it("limits invitations", () => {
    expect(canInviteMembers("owner")).toBe(true);
    expect(canInviteMembers("admin")).toBe(true);
    expect(canInviteMembers("member")).toBe(false);
  });

  it("limits role changes", () => {
    expect(canChangeRoles("admin")).toBe(true);
    expect(canChangeRoles("assistant")).toBe(false);
  });

  it("limits audit visibility", () => {
    expect(canViewAudit("owner")).toBe(true);
    expect(canViewAudit("assistant")).toBe(true);
    expect(canViewAudit("member")).toBe(false);
  });

  it("limits contact editing", () => {
    expect(canEditContacts("assistant")).toBe(true);
    expect(canEditContacts("member")).toBe(true);
    expect(canEditContacts("read-only")).toBe(false);
  });
});
