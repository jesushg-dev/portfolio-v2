jest.mock("@/env", () => ({
  env: { PRIMARY_DOMAIN: "jesushg.com" },
}));

import type { CvContactType } from "@prisma/client";
import { resolveCvDisplayContacts } from "./resolve-cv-display-contacts";

describe("resolveCvDisplayContacts", () => {
  it("returns a copy when there is no profile", () => {
    const contacts = [{ type: "EMAIL" as const, value: "a@b.com" }];
    expect(resolveCvDisplayContacts(contacts, null)).toEqual(contacts);
    expect(resolveCvDisplayContacts(contacts, null)).not.toBe(contacts);
  });

  it("appends the portfolio website for a tenant profile", () => {
    const inputContacts: { type: CvContactType; value: string }[] = [
      { type: "EMAIL", value: "test@example.com" },
    ];
    const contacts = resolveCvDisplayContacts(inputContacts, {
      username: "ada",
      isPrimary: false,
      customDomain: null,
    });
    expect(contacts.some((contact) => contact.type === "WEBSITE")).toBe(true);
  });
});
