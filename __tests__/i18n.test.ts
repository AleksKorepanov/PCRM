import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { createUser, findUserById, updateUserLocale } from "@/lib/store";
import { TextCopy, getText, mergeText } from "@/lib/text";

describe("i18n preferences", () => {
  it("defaults new users to ru", () => {
    const user = createUser({
      email: `user-${randomUUID()}@example.com`,
      passwordHash: "hash",
      passwordSalt: "salt",
    });

    const persisted = findUserById(user.id);
    expect(persisted?.locale).toBe("ru");
  });

  it("allows overriding locale to en", () => {
    const user = createUser({
      email: `user-${randomUUID()}@example.com`,
      passwordHash: "hash",
      passwordSalt: "salt",
    });

    const updated = updateUserLocale(user.id, "en");
    expect(updated?.locale).toBe("en");
  });

  it("falls back to ru for missing keys", () => {
    const ru = getText("ru");
    const overrides: Partial<TextCopy> = {
      nav: {
        dashboard: "Dashboard",
      } as TextCopy["nav"],
    };

    const merged = mergeText(ru, overrides);

    expect(merged.nav.dashboard).toBe("Dashboard");
    expect(merged.nav.contacts).toBe(ru.nav.contacts);
  });
});
