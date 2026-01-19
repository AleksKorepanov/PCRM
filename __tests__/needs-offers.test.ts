import { beforeEach, describe, expect, it } from "vitest";

import {
  createNeedOffer,
  listNeedOfferMatches,
  refreshNeedOfferMatches,
  resetNeedsOffersStore,
} from "@/lib/needs-offers";

describe("needs/offers", () => {
  beforeEach(() => {
    resetNeedsOffersStore();
  });

  it("calculates deterministic match scores", () => {
    const workspaceId = "ws-1";

    createNeedOffer({
      workspaceId,
      ownerUserId: "owner@pcrm.local",
      entryType: "need",
      title: "Need fintech intro",
      description: "Looking for fintech partnerships and growth marketing",
      tags: ["fintech", "b2b"],
      geo: { mode: "local", city: "Berlin", country: "Germany" },
    });

    createNeedOffer({
      workspaceId,
      ownerUserId: "owner@pcrm.local",
      entryType: "offer",
      title: "Offer fintech growth support",
      description: "Offering fintech growth support",
      tags: ["fintech", "growth"],
      geo: { mode: "local", city: "Berlin", country: "Germany" },
    });

    refreshNeedOfferMatches({ workspaceId });

    const matches = listNeedOfferMatches({
      workspaceId,
      viewer: { userId: "owner@pcrm.local", role: "assistant" },
    });

    expect(matches).toHaveLength(1);
    expect(matches[0]?.score).toBe(65);
    expect(matches[0]?.explanation.ru).toContain("Ключевые слова");
  });

  it("filters confidential matches for non-owners", () => {
    const workspaceId = "ws-2";

    createNeedOffer({
      workspaceId,
      ownerUserId: "owner@pcrm.local",
      entryType: "need",
      title: "Private need",
      description: "Confidential details",
      tags: ["shared"],
      visibility: "private",
    });

    createNeedOffer({
      workspaceId,
      ownerUserId: "owner@pcrm.local",
      entryType: "offer",
      title: "Workspace offer",
      description: "Public offer",
      tags: ["shared"],
      visibility: "workspace",
    });

    refreshNeedOfferMatches({ workspaceId });

    const viewerMatches = listNeedOfferMatches({
      workspaceId,
      viewer: { userId: "viewer@pcrm.local", role: "member" },
    });

    expect(viewerMatches).toHaveLength(0);

    const ownerMatches = listNeedOfferMatches({
      workspaceId,
      viewer: { userId: "owner@pcrm.local", role: "member" },
    });

    expect(ownerMatches).toHaveLength(1);
  });
});
