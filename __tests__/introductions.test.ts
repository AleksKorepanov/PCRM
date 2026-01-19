import { beforeEach, describe, expect, it } from "vitest";

import {
  createIntroduction,
  recordIntroductionOutcome,
  resetIntroductionsStore,
  updateIntroductionConsent,
} from "@/lib/introductions";
import { resetInteractionsStore, listInteractions } from "@/lib/interactions";
import { listRelations, resetRelationsStore } from "@/lib/relations";

describe("introductions", () => {
  beforeEach(() => {
    resetIntroductionsStore();
    resetInteractionsStore();
    resetRelationsStore();
  });

  it("tracks consent status and policies", () => {
    const workspaceId = "ws-intro";

    const intro = createIntroduction({
      workspaceId,
      introducerContactId: "introducer",
      contactAId: "contact-a",
      contactBId: "contact-b",
      ask: "Warm intro",
      consentPolicy: "mutual",
    });

    const afterFirstConsent = updateIntroductionConsent({
      workspaceId,
      introductionId: intro.id,
      contactId: "contact-a",
      status: "approved",
    });

    expect(afterFirstConsent?.status).toBe("requested");

    const afterSecondConsent = updateIntroductionConsent({
      workspaceId,
      introductionId: intro.id,
      contactId: "contact-b",
      status: "approved",
    });

    expect(afterSecondConsent?.status).toBe("accepted");

    const declinedIntro = createIntroduction({
      workspaceId,
      introducerContactId: "introducer",
      contactAId: "contact-c",
      contactBId: "contact-d",
      ask: "Follow-up intro",
      consentPolicy: "single",
    });

    const declined = updateIntroductionConsent({
      workspaceId,
      introductionId: declinedIntro.id,
      contactId: "contact-d",
      status: "declined",
    });

    expect(declined?.status).toBe("declined");
  });

  it("records outcomes with timeline events and graph edges", () => {
    const workspaceId = "ws-outcome";

    const intro = createIntroduction({
      workspaceId,
      introducerContactId: "introducer",
      contactAId: "contact-a",
      contactBId: "contact-b",
      ask: "Investor intro",
      consentPolicy: "mutual",
    });

    const updated = recordIntroductionOutcome({
      workspaceId,
      introductionId: intro.id,
      status: "connected",
      summary: "Meeting booked",
    });

    expect(updated?.status).toBe("completed");
    expect(updated?.outcome?.status).toBe("connected");

    const edges = listRelations(workspaceId).relationshipEdges;
    expect(edges).toHaveLength(2);
    edges.forEach((edge) => {
      expect(edge.introducedByContactId).toBe("introducer");
    });

    const interactions = listInteractions({
      workspaceId,
      role: "assistant",
      query: "intro",
    }).interactions;

    const introEvent = interactions.find(
      (interaction) => interaction.subject === "Intro outcome"
    );
    expect(introEvent).toBeTruthy();
    const participantIds = introEvent?.participants.map(
      (participant) => participant.contactId
    );
    expect(participantIds).toEqual(expect.arrayContaining(["introducer", "contact-a", "contact-b"]));
  });
});
