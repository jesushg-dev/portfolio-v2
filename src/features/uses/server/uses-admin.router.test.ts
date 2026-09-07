import { usesAdminRouter } from "./uses-admin.router";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

const languages = [{ id: "lang-en", code: "en" }];

const usesItem = {
  id: "uses-1",
  type: "SOFTWARE",
  href: "https://cursor.com",
  image: "",
  order: 0,
  userId: MOCK_OWNER_USER.id,
  UsesItemTranslation: [
    { appLanguageId: "lang-en", title: "Cursor", description: "Editor" },
  ],
};

const emptySettings = {
  id: "set-1",
  userId: MOCK_OWNER_USER.id,
  workspaceImage: null,
  codingPreviewLight: null,
  codingPreviewDark: null,
  UsesSettingsTranslation: [],
  UsesClarification: [],
  UsesWorkspaceTag: [],
};

function createDb() {
  return {
    appLanguage: { findMany: jest.fn().mockResolvedValue(languages) },
    usesItem: {
      findMany: jest.fn().mockResolvedValue([usesItem]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(usesItem),
      findUniqueOrThrow: jest.fn().mockResolvedValue(usesItem),
      create: jest.fn().mockResolvedValue(usesItem),
      update: jest.fn().mockResolvedValue(usesItem),
      delete: jest.fn().mockResolvedValue(usesItem),
    },
    usesItemTranslation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    usesWorkspaceTag: { deleteMany: jest.fn(), createMany: jest.fn() },
    usesSettings: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(emptySettings),
      upsert: jest.fn().mockResolvedValue(emptySettings),
      findUniqueOrThrow: jest.fn().mockResolvedValue(emptySettings),
    },
    usesSettingsTranslation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    },
    usesClarification: {
      deleteMany: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: "cl-1" }),
    },
    usesClarificationTranslation: { deleteMany: jest.fn() },
  };
}

describe("usesAdminRouter", () => {
  it("lists items and returns an empty create DTO", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      usesAdminRouter,
      createTrpcTestContext({ db }),
    );
    const listed = await caller.getMine({
      page: 1,
      perPage: 10,
      sort: [],
      filters: [
        {
          id: "title",
          value: "Cur",
          variant: "text",
          operator: "iLike",
          filterId: "f1",
        },
      ],
      type: "SOFTWARE",
    });
    expect(listed.data[0]?.translations["lang-en"]?.title).toBe("Cursor");

    const empty = await caller.emptyCreateDto({ type: "EVERYDAY" });
    expect(empty.initialData.type).toBe("EVERYDAY");
  });

  it("creates, updates, and deletes an item", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      usesAdminRouter,
      createTrpcTestContext({ db }),
    );
    await caller.createItem({
      type: "SOFTWARE",
      href: "https://cursor.com",
      image: "",
      order: 0,
      translations: {
        "lang-en": { title: "Cursor", description: "Editor" },
      },
    });
    await caller.updateItem({
      id: "uses-1",
      type: "SOFTWARE",
      href: "https://cursor.com",
      image: "",
      order: 1,
      translations: {
        "lang-en": { title: "Cursor", description: "AI editor" },
      },
    });
    await expect(caller.deleteItem({ id: "uses-1" })).resolves.toEqual({
      ok: true,
    });
  });

  it("creates default settings when none exist", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      usesAdminRouter,
      createTrpcTestContext({ db }),
    );
    const settings = await caller.getSettings();
    expect(settings.id).toBe("set-1");
    expect(db.usesSettings.create).toHaveBeenCalled();
  });

  it("upserts settings with tags for owned items", async () => {
    const db = createDb();
    db.usesSettings.findUnique.mockResolvedValue(emptySettings);
    db.usesItem.findMany.mockResolvedValue([{ id: "uses-1" }]);
    const caller = createRouterCaller(
      usesAdminRouter,
      createTrpcTestContext({ db }),
    );
    await caller.upsertSettings({
      workspaceImage: "",
      codingPreviewLight: "",
      codingPreviewDark: "",
      translations: {
        "lang-en": { codingIntro: "Hi", browserIntro: "Browse" },
      },
      clarifications: [
        {
          order: 0,
          translations: { "lang-en": { body: "Note" } },
        },
      ],
      workspaceTags: [
        { usesItemId: "uses-1", xPercent: 120, yPercent: -10, order: 0 },
      ],
    });
    expect(db.usesSettings.upsert).toHaveBeenCalled();
  });
});
