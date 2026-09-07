jest.mock("@/lib/tenant/resolve", () => ({
  resolveTenant: jest.fn(),
}));

jest.mock("@/server/db", () => ({
  db: {
    usesSettings: { findUnique: jest.fn() },
    usesItem: { findMany: jest.fn() },
  },
}));

import { resolveTenant } from "@/lib/tenant/resolve";
import { db } from "@/server/db";
import { getUsesPageData } from "./uses-public";

describe("getUsesPageData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null without a tenant", async () => {
    jest.mocked(resolveTenant).mockResolvedValue(null);
    await expect(getUsesPageData("en")).resolves.toBeNull();
  });

  it("groups items and maps workspace tags for visible software", async () => {
    jest.mocked(resolveTenant).mockResolvedValue({
      userId: "user-1",
      username: "ada",
      defaultLocale: "en",
      isPrimary: true,
      isPublished: true,
      displayName: "Ada",
      logoInitials: "AL",
      logoImageUrl: null,
    });
    jest.mocked(db.usesSettings.findUnique).mockResolvedValue({
      workspaceImage: "https://cdn.example/desk.png",
      codingPreviewLight: null,
      codingPreviewDark: null,
      UsesSettingsTranslation: [
        {
          language: { code: "en" },
          codingIntro: "I write here",
          browserIntro: "I browse here",
        },
      ],
      UsesClarification: [
        {
          UsesClarificationTranslation: [
            { body: "Note", language: { code: "en" } },
          ],
        },
      ],
      UsesWorkspaceTag: [
        {
          usesItemId: "sw-1",
          xPercent: 20,
          yPercent: 40,
          UsesItem: {
            id: "sw-1",
            href: "https://cursor.com",
            image: "https://cdn.example/cursor.png",
            UsesItemTranslation: [
              {
                title: "Cursor",
                description: "Editor",
                language: { code: "en" },
              },
            ],
          },
        },
      ],
    } as never);
    jest.mocked(db.usesItem.findMany).mockResolvedValue([
      {
        id: "sw-1",
        type: "SOFTWARE",
        href: "https://cursor.com",
        image: "https://cdn.example/cursor.png",
        UsesItemTranslation: [
          { title: "Cursor", description: "Editor", language: { code: "en" } },
        ],
      },
      {
        id: "ev-1",
        type: "EVERYDAY",
        href: "",
        image: null,
        UsesItemTranslation: [
          { title: "Desk", description: null, language: { code: "es" } },
        ],
      },
      {
        id: "br-1",
        type: "BROWSER",
        href: "https://arc.net",
        image: null,
        UsesItemTranslation: [
          { title: "Arc", description: "Browser", language: { code: "en" } },
        ],
      },
    ] as never);

    const page = await getUsesPageData("en");
    expect(page?.software[0]?.title).toBe("Cursor");
    expect(page?.everyday[0]?.title).toBe("Desk");
    expect(page?.browser[0]?.title).toBe("Arc");
    expect(page?.settings.codingIntro).toBe("I write here");
    expect(page?.settings.clarifications).toEqual(["Note"]);
    expect(page?.settings.workspaceTags).toEqual([
      { itemId: "sw-1", title: "Cursor", xPercent: 20, yPercent: 40 },
    ]);
  });
});
