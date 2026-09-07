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
    usesItem: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    usesSettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import { db } from "@/server/db";
import {
  getUsesItemCreatePageData,
  getUsesItemEditPageData,
  getUserUsesItemsWithLanguages,
  getUsesSettingsPageData,
} from "./uses-queries";

const languages = [{ id: "lang-en", code: "en" }];
const item = {
  id: "uses-1",
  type: "SOFTWARE",
  href: "https://cursor.com",
  image: "",
  order: 0,
  userId: "user-1",
  UsesItemTranslation: [
    { appLanguageId: "lang-en", title: "Cursor", description: "Editor" },
  ],
};
const settings = {
  id: "set-1",
  userId: "user-1",
  workspaceImage: null,
  codingPreviewLight: null,
  codingPreviewDark: null,
  UsesSettingsTranslation: [],
  UsesClarification: [],
  UsesWorkspaceTag: [],
};

describe("uses-queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(requireAuthenticatedUserId).mockResolvedValue("user-1");
    jest.mocked(db.appLanguage.findMany).mockResolvedValue(languages as never);
  });

  it("returns create, edit, and list data", async () => {
    jest.mocked(db.usesItem.findUnique).mockResolvedValue(item as never);
    jest.mocked(db.usesItem.findMany).mockResolvedValue([item] as never);
    jest.mocked(db.usesItem.count).mockResolvedValue(1);

    const created = await getUsesItemCreatePageData("SOFTWARE");
    expect(created.initialData.type).toBe("SOFTWARE");

    const editor = await getUsesItemEditPageData("uses-1");
    expect(editor.editorDto.translations["lang-en"]?.title).toBe("Cursor");

    const listed = await getUserUsesItemsWithLanguages({
      page: 1,
      perPage: 10,
      sort: [],
      filters: [],
      type: "SOFTWARE",
    });
    expect(listed.totalCount).toBe(1);
  });

  it("creates settings when missing", async () => {
    jest.mocked(db.usesSettings.findUnique).mockResolvedValue(null);
    jest.mocked(db.usesSettings.create).mockResolvedValue(settings as never);
    jest.mocked(db.usesItem.findMany).mockResolvedValue([] as never);
    const page = await getUsesSettingsPageData();
    expect(page.settings.id).toBe("set-1");
  });

  it("throws when the item is missing", async () => {
    jest.mocked(db.usesItem.findUnique).mockResolvedValue(null);
    await expect(getUsesItemEditPageData("missing")).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
