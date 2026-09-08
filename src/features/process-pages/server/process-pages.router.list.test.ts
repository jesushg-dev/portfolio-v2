import { processPagesRouter } from "./process-pages.router";
import {
  createRouterCaller,
  createTrpcTestContext,
} from "@/test-utils/trpc-caller";

const enLanguage = { id: "lang-en", code: "en" };

describe("processPagesRouter.listForNav", () => {
  it("returns an empty list without a tenant", async () => {
    const caller = createRouterCaller(
      processPagesRouter,
      createTrpcTestContext({ db: {}, tenant: null }),
    );
    await expect(caller.listForNav({ locale: "en" })).resolves.toEqual([]);
  });

  it("maps published nav pages", async () => {
    const db = {
      appLanguage: { findMany: jest.fn().mockResolvedValue([enLanguage]) },
      processPage: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "p1",
            slug: "how-i-use-ai",
            template: "WORKFLOW",
            navIcon: "Bot",
            order: 0,
            ProcessPageTranslation: [
              {
                appLanguageId: "lang-en",
                menuTitle: "AI",
                navDescription: "Workflow",
              },
            ],
          },
        ]),
      },
    };
    const caller = createRouterCaller(
      processPagesRouter,
      createTrpcTestContext({ db }),
    );
    const pages = await caller.listForNav({ locale: "en" });
    expect(pages).toEqual([
      expect.objectContaining({
        slug: "how-i-use-ai",
        menuTitle: "AI",
        navDescription: "Workflow",
      }),
    ]);
  });
});

describe("processPagesRouter.getBySlug", () => {
  it("returns null when unpublished", async () => {
    const db = {
      appLanguage: { findMany: jest.fn().mockResolvedValue([enLanguage]) },
      processPage: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const caller = createRouterCaller(
      processPagesRouter,
      createTrpcTestContext({ db }),
    );
    await expect(
      caller.getBySlug({ slug: "draft", locale: "en" }),
    ).resolves.toBeNull();
  });
});
