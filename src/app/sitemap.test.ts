jest.mock("@/i18n/routing", () => ({
  getPathname: ({
    href,
  }: {
    href: string | { pathname: string; params: { slug: string } };
  }) => {
    if (typeof href === "string") return href;
    return href.pathname.replace("[slug]", href.params.slug);
  },
}));

import sitemap from "./sitemap";

jest.mock("@/server/db", () => ({
  db: {
    profile: { findFirst: jest.fn() },
    project: { findMany: jest.fn() },
    skill: { findMany: jest.fn() },
    processPage: { findMany: jest.fn() },
  },
}));

import { db } from "@/server/db";

describe("sitemap", () => {
  it("returns only static entries when there is no primary profile", async () => {
    jest.spyOn(db.profile, "findFirst").mockResolvedValue(null);
    const findProjectsSpy = jest.spyOn(db.project, "findMany");
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);
    expect(findProjectsSpy).not.toHaveBeenCalled();
  });

  it("adds project, skill, and process page URLs", async () => {
    jest.spyOn(db.profile, "findFirst").mockResolvedValue({
      userId: "user-1",
      updatedAt: new Date("2026-01-01"),
    } as never);
    jest.spyOn(db.project, "findMany").mockResolvedValue([
      { slug: "eleven", createdAt: new Date("2026-01-02") },
      { slug: "  ", createdAt: new Date("2026-01-02") },
    ] as never);
    jest
      .spyOn(db.skill, "findMany")
      .mockResolvedValue([
        { title: "Next.js", createdAt: new Date("2026-01-03") },
      ] as never);
    jest
      .spyOn(db.processPage, "findMany")
      .mockResolvedValue([
        { slug: "how-i-use-ai", updatedAt: new Date("2026-01-04") },
      ] as never);

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url).join(" ");
    expect(urls).toContain("eleven");
    expect(urls).toContain("next-js");
    expect(urls).toContain("how-i-use-ai");
  });
});
