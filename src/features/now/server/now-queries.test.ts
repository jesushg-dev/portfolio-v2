jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

jest.mock("@/lib/admin/get-authenticated-user-id", () => ({
  requireAuthenticatedUserId: jest.fn(),
}));

jest.mock("@/server/db", () => ({
  db: {
    appLanguage: { findMany: jest.fn() },
    nowSettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    nowFocus: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import { db } from "@/server/db";
import {
  getNowAdminPageData,
  getNowFocusCreatePageData,
  getNowFocusEditPageData,
} from "./now-queries";

const languages = [{ id: "lang-en", code: "en" }];
const settings = {
  id: "now-1",
  userId: "user-1",
  timezone: "UTC",
  githubUsername: null,
  statusEmoji: "🚀",
  readingTitle: null,
  readingAuthors: null,
  readingProgress: 0,
  watchedTitle: null,
  watchedRating: 0,
  githubRepo: null,
  githubHref: null,
  photoUrls: [],
  NowSettingsTranslation: [],
};
const focus = {
  id: "focus-1",
  userId: "user-1",
  order: 0,
  NowFocusTranslation: [
    { appLanguageId: "lang-en", label: "Work", body: "Tests" },
  ],
};

describe("now-queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(requireAuthenticatedUserId).mockResolvedValue("user-1");
    jest
      .spyOn(db.appLanguage, "findMany")
      .mockResolvedValue(languages as never);
  });

  it("creates settings when missing and returns focuses", async () => {
    jest.spyOn(db.nowSettings, "findUnique").mockResolvedValue(null);
    jest.spyOn(db.nowSettings, "create").mockResolvedValue(settings as never);
    jest.spyOn(db.nowFocus, "findMany").mockResolvedValue([focus] as never);

    const page = await getNowAdminPageData();
    expect(page.settings.timezone).toBe("UTC");
    expect(page.focuses[0]?.translations["lang-en"]?.label).toBe("Work");
  });

  it("returns a focus create DTO and edit DTO", async () => {
    jest.spyOn(db.nowFocus, "findUnique").mockResolvedValue(focus as never);
    const created = await getNowFocusCreatePageData();
    expect(created.initialData.order).toBe(0);

    const editor = await getNowFocusEditPageData("focus-1");
    expect(editor.editorDto.id).toBe("focus-1");
  });

  it("throws when the focus is missing", async () => {
    jest.spyOn(db.nowFocus, "findUnique").mockResolvedValue(null);
    await expect(getNowFocusEditPageData("missing")).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
