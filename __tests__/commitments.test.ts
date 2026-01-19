import { beforeEach, describe, expect, it } from "vitest";

import {
  createCommitment,
  createCommitmentWithRole,
  deleteCommitmentWithRole,
  getCommitmentReliability,
  resetCommitmentsStore,
  updateCommitmentWithRole,
} from "@/lib/commitments";

describe("commitments", () => {
  beforeEach(() => {
    resetCommitmentsStore();
  });

  it("calculates reliability metrics for commitments", () => {
    const workspaceId = "ws-1";
    const contactId = "contact-1";

    createCommitment({
      workspaceId,
      title: "Ship roadmap",
      status: "fulfilled",
      dueAt: "2024-05-01T00:00:00Z",
      closedAt: "2024-04-30T12:00:00Z",
      parties: [{ contactId, role: "owed_by" }],
    });

    createCommitment({
      workspaceId,
      title: "Introduce investor",
      status: "fulfilled",
      dueAt: "2024-05-10T00:00:00Z",
      closedAt: "2024-05-12T10:00:00Z",
      parties: [{ contactId, role: "owed_by" }],
    });

    createCommitment({
      workspaceId,
      title: "Send deck",
      status: "open",
      dueAt: "2000-01-01T00:00:00Z",
      parties: [{ contactId, role: "owed_by" }],
    });

    createCommitment({
      workspaceId,
      title: "Canceled item",
      status: "canceled",
      dueAt: "2024-06-01T00:00:00Z",
      parties: [{ contactId, role: "owed_by" }],
    });

    const reliability = getCommitmentReliability({ workspaceId, contactId });

    expect(reliability.totalWithDueDates).toBe(3);
    expect(reliability.closedWithDueDates).toBe(2);
    expect(reliability.onTimeClosed).toBe(1);
    expect(reliability.lateClosed).toBe(1);
    expect(reliability.overdueOpen).toBe(1);
    expect(reliability.onTimeClosureRatio).toBeCloseTo(0.5, 4);
    expect(reliability.overdueRate).toBeCloseTo(2 / 3, 4);
  });

  it("enforces role permissions for commitment mutations", () => {
    const commitment = createCommitment({
      workspaceId: "ws-2",
      title: "Define OKRs",
      parties: [{ contactId: "contact-2", role: "owed_by" }],
    });

    const readOnlyCreate = createCommitmentWithRole({
      role: "read-only",
      workspaceId: "ws-2",
      title: "Blocked",
    });

    expect(readOnlyCreate).toBeUndefined();

    const readOnlyUpdate = updateCommitmentWithRole({
      role: "read-only",
      workspaceId: "ws-2",
      commitmentId: commitment.id,
      updates: { title: "Updated" },
    });

    expect(readOnlyUpdate).toBeUndefined();

    const readOnlyDelete = deleteCommitmentWithRole({
      role: "read-only",
      workspaceId: "ws-2",
      commitmentId: commitment.id,
    });

    expect(readOnlyDelete).toBe(false);

    const assistantUpdate = updateCommitmentWithRole({
      role: "assistant",
      workspaceId: "ws-2",
      commitmentId: commitment.id,
      updates: { title: "Updated" },
    });

    expect(assistantUpdate?.title).toBe("Updated");
  });
});
