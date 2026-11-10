import { profileAdminRouter } from "@/features/profile/server/profile-admin.router";
import { portfolioRouter } from "@/server/api/routers/portfolio";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";
import { parseFaqItems } from "./faq-content";

const item = { question: "Can we collaborate?", answer: "Contact my team." };

describe("tenant FAQ", () => {
  it("filters malformed records and trims valid stored text", () => {
    expect(
      parseFaqItems([
        null,
        { question: "", answer: "bad" },
        { question: " Hi ", answer: " There " },
      ]),
    ).toEqual([{ question: "Hi", answer: "There" }]);
  });

  it("reads only the requested tenant and language, without fallback", async () => {
    const db = {
      portfolioHeader: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ translations: [{ faqItems: [item] }] }),
      },
    };
    const caller = createRouterCaller(
      portfolioRouter,
      createTrpcTestContext({ db }),
    );
    await expect(caller.getFaqItems({ locale: "nl" })).resolves.toEqual([item]);
    expect(db.portfolioHeader.findUnique).toHaveBeenCalledWith({
      where: { userId: MOCK_OWNER_USER.id },
      select: {
        translations: {
          where: { language: { code: "nl" } },
          select: { faqItems: true },
        },
      },
    });
    db.portfolioHeader.findUnique.mockResolvedValue({ translations: [] });
    await expect(caller.getFaqItems({ locale: "nl" })).resolves.toEqual([]);
  });

  it("returns no public FAQ when no tenant is resolved", async () => {
    const caller = createRouterCaller(
      portfolioRouter,
      createTrpcTestContext({ db: {}, tenant: null }),
    );
    await expect(caller.getFaqItems({ locale: "en" })).resolves.toEqual([]);
  });

  it("rejects anonymous writes and incomplete questions", async () => {
    const anonymous = createRouterCaller(
      profileAdminRouter,
      createTrpcTestContext({ db: {}, user: null }),
    );
    await expect(
      anonymous.upsertFaq({ appLanguageId: "lang", items: [item] }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const caller = createRouterCaller(
      profileAdminRouter,
      createTrpcTestContext({ db: {} }),
    );
    await expect(
      caller.upsertFaq({
        appLanguageId: "lang",
        items: [{ question: "", answer: "" }],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("writes FAQ only to the signed-in owner's header and chosen language", async () => {
    const db = {
      appLanguage: { findUnique: jest.fn().mockResolvedValue({ id: "lang" }) },
      portfolioHeader: {
        upsert: jest.fn().mockResolvedValue({ id: "header" }),
      },
      portfolioHeaderTranslation: { upsert: jest.fn() },
    };
    const caller = createRouterCaller(
      profileAdminRouter,
      createTrpcTestContext({ db }),
    );
    await caller.upsertFaq({ appLanguageId: "lang", items: [item] });
    expect(db.portfolioHeader.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: MOCK_OWNER_USER.id } }),
    );
    expect(db.portfolioHeaderTranslation.upsert).toHaveBeenCalledWith({
      where: {
        portfolioHeaderId_appLanguageId: {
          portfolioHeaderId: "header",
          appLanguageId: "lang",
        },
      },
      create: {
        portfolioHeaderId: "header",
        appLanguageId: "lang",
        faqItems: [item],
      },
      update: { faqItems: [item] },
    });
  });
});
