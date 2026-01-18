import {
  createContact,
  listContacts,
  resetContactsStore,
} from "@/lib/contacts";

const workspaceId = "ws-test";

beforeEach(() => {
  resetContactsStore();
});

describe("contacts service", () => {
  it("filters by tags and trust score", () => {
    createContact({
      workspaceId,
      name: "Alpha",
      tags: ["growth", "investor"],
      trustScore: 90,
    });
    createContact({
      workspaceId,
      name: "Beta",
      tags: ["design"],
      trustScore: 60,
    });

    const result = listContacts({
      workspaceId,
      filters: {
        tags: ["investor"],
        trustScoreMin: 80,
      },
    });

    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0]?.name).toBe("Alpha");
  });

  it("sorts by name", () => {
    createContact({ workspaceId, name: "Zeta" });
    createContact({ workspaceId, name: "Alpha" });

    const result = listContacts({
      workspaceId,
      sort: "name",
    });

    expect(result.contacts[0]?.name).toBe("Alpha");
    expect(result.contacts[1]?.name).toBe("Zeta");
  });

  it("paginates results", () => {
    createContact({ workspaceId, name: "One" });
    createContact({ workspaceId, name: "Two" });
    createContact({ workspaceId, name: "Three" });

    const pageOne = listContacts({ workspaceId, page: 1, perPage: 2 });
    const pageTwo = listContacts({ workspaceId, page: 2, perPage: 2 });

    expect(pageOne.contacts).toHaveLength(2);
    expect(pageTwo.contacts).toHaveLength(1);
  });
});
