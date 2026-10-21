import { TRPCError } from "@trpc/server";

import { processPagesAdminRouter } from "./process-pages-admin.router";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

const languages = [{ id: "lang-en", code: "en" }];

const page = {
  id: "pp-1",
  slug: "how-i-use-ai",
  template: "WORKFLOW",
  isPublished: true,
  showInNav: true,
  order: 0,
  navIcon: "Bot",
  userId: MOCK_OWNER_USER.id,
  ProcessPageTranslation: [],
};

function createDb() {
  return {
    appLanguage: { findMany: jest.fn().mockResolvedValue(languages) },
    processPage: {
      findMany: jest.fn().mockResolvedValue([page]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(page),
      findUniqueOrThrow: jest.fn().mockResolvedValue(page),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(page),
      update: jest.fn().mockResolvedValue(page),
      delete: jest.fn().mockResolvedValue(page),
    },
    processPageTranslation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
}

const upsertInput = {
  slug: "how-i-use-ai",
  template: "WORKFLOW" as const,
  isPublished: true,
  showInNav: true,
  order: 0,
  navIcon: "Bot" as const,
  translations: {
    "lang-en": { menuTitle: "AI", heroTitle: "How I use AI" },
  },
  contentByLanguage: {},
};

describe("processPagesAdminRouter", () => {
  it("lists pages and returns an empty create DTO", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      processPagesAdminRouter,
      createTrpcTestContext({ db }),
    );
    const listed = await caller.getMine({
      page: 1,
      perPage: 10,
      sort: [],
      filters: [
        {
          id: "title",
          value: "AI",
          variant: "text",
          operator: "iLike",
          filterId: "f1",
        },
      ],
      template: "WORKFLOW",
    });
    expect(listed.data[0]?.slug).toBe("how-i-use-ai");

    const empty = await caller.emptyCreateDto();
    expect(empty.initialData.template).toBe("WORKFLOW");
  });

  it("loads a page by id", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      processPagesAdminRouter,
      createTrpcTestContext({ db }),
    );
    const result = await caller.getById({ id: "pp-1" });
    expect(result.id).toBe("pp-1");
  });

  it("throws when the page is missing", async () => {
    const db = createDb();
    db.processPage.findUnique.mockResolvedValue(null);
    const caller = createRouterCaller(
      processPagesAdminRouter,
      createTrpcTestContext({ db }),
    );
    await expect(caller.getById({ id: "missing" })).rejects.toBeInstanceOf(
      TRPCError,
    );
  });

  it("creates, updates, and deletes a page", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      processPagesAdminRouter,
      createTrpcTestContext({ db }),
    );
    await caller.createItem(upsertInput);
    await caller.updateItem({
      id: "pp-1",
      ...upsertInput,
      slug: "how-i-use-ai",
    });
    await caller.deleteItem({ id: "pp-1" });
    expect(db.processPage.create).toHaveBeenCalled();
    expect(db.processPage.delete).toHaveBeenCalled();
  });

  it("rejects a duplicate slug on create", async () => {
    const db = createDb();
    db.processPage.findFirst.mockResolvedValue({ id: "pp-1" });
    const caller = createRouterCaller(
      processPagesAdminRouter,
      createTrpcTestContext({ db }),
    );
    await expect(caller.createItem(upsertInput)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
