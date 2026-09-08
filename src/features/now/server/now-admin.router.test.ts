import { nowAdminRouter } from "./now-admin.router";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

const languages = [{ id: "lang-en", code: "en" }];

const settings = {
  id: "now-1",
  userId: MOCK_OWNER_USER.id,
  timezone: "America/Mexico_City",
  githubUsername: "ada",
  statusEmoji: "🚀",
  readingTitle: "Book",
  readingAuthors: "Author",
  readingProgress: 40,
  watchedTitle: "Show",
  watchedRating: 4,
  githubRepo: "portfolio",
  githubHref: "https://github.com/ada/portfolio",
  photoUrls: [],
  NowSettingsTranslation: [
    {
      appLanguageId: "lang-en",
      statusBody: "Building",
      statusRelative: "now",
      githubBody: "Shipping",
      githubRelative: "this week",
    },
  ],
};

const focus = {
  id: "focus-1",
  userId: MOCK_OWNER_USER.id,
  order: 0,
  NowFocusTranslation: [
    { appLanguageId: "lang-en", label: "Work", body: "Tests" },
  ],
};

function createDb() {
  return {
    appLanguage: { findMany: jest.fn().mockResolvedValue(languages) },
    nowSettings: {
      findUnique: jest.fn().mockResolvedValue(null),
      findUniqueOrThrow: jest.fn().mockResolvedValue(settings),
      create: jest.fn().mockResolvedValue(settings),
      upsert: jest.fn().mockResolvedValue(settings),
    },
    nowSettingsTranslation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    },
    nowFocus: {
      findMany: jest.fn().mockResolvedValue([focus]),
      findUnique: jest.fn().mockResolvedValue(focus),
      findUniqueOrThrow: jest.fn().mockResolvedValue(focus),
      create: jest.fn().mockResolvedValue(focus),
      update: jest.fn().mockResolvedValue(focus),
      delete: jest.fn().mockResolvedValue(focus),
    },
    nowFocusTranslation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
}

describe("nowAdminRouter", () => {
  it("creates default settings when missing", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      nowAdminRouter,
      createTrpcTestContext({ db }),
    );
    const result = await caller.getSettings();
    expect(result.timezone).toBe("America/Mexico_City");
    expect(db.nowSettings.create).toHaveBeenCalled();
  });

  it("returns existing settings without creating", async () => {
    const db = createDb();
    db.nowSettings.findUnique.mockResolvedValue(settings);
    const caller = createRouterCaller(
      nowAdminRouter,
      createTrpcTestContext({ db }),
    );
    const result = await caller.getSettings();
    expect(result.githubUsername).toBe("ada");
    expect(db.nowSettings.create).not.toHaveBeenCalled();
  });

  it("upserts settings and manages focuses", async () => {
    const db = createDb();
    db.nowSettings.findUnique.mockResolvedValue(settings);
    const caller = createRouterCaller(
      nowAdminRouter,
      createTrpcTestContext({ db }),
    );
    await caller.upsertSettings({
      timezone: "UTC",
      githubUsername: "ada",
      statusEmoji: "🚀",
      readingTitle: "Book",
      readingAuthors: "Author",
      readingProgress: 10,
      watchedTitle: "Show",
      watchedRating: 5,
      githubRepo: "portfolio",
      githubHref: "https://github.com/ada/portfolio",
      photoUrls: [],
      translations: {
        "lang-en": {
          statusBody: "Building",
          statusRelative: "now",
          githubBody: "Shipping",
          githubRelative: "this week",
        },
      },
    });

    const focuses = await caller.getFocuses();
    expect(focuses[0]?.translations["lang-en"]?.label).toBe("Work");

    await caller.createFocus({
      order: 1,
      translations: { "lang-en": { label: "Life", body: "Rest" } },
    });
    await caller.updateFocus({
      id: "focus-1",
      order: 2,
      translations: { "lang-en": { label: "Work", body: "Coverage" } },
    });
    await caller.deleteFocus({ id: "focus-1" });
    const empty = await caller.emptyFocusCreateDto();
    expect(empty.initialData.order).toBe(0);
  });
});
