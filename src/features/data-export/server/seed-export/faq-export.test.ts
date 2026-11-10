import { serializeFaq } from "./faq-serialize";
import { seedExportRouter } from "./seed-export.router";
import { restorePortfolioFaq } from "../../../../../prisma/lib/faq-seed";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

const items = [
  { question: "Remote work?", answer: "Contact us for current availability." },
];
const header = {
  id: "header",
  translations: [
    { appLanguageId: "nl-id", faqItems: items },
    { appLanguageId: "en-id", faqItems: [] },
  ],
};
const languages = [
  { id: "en-id", code: "en" },
  { id: "nl-id", code: "nl" },
];

describe("FAQ backup", () => {
  it("round-trips localized content and explicit empty languages through seed restoration", async () => {
    const exported = serializeFaq(header, languages);
    const db = {
      portfolioHeader: {
        upsert: jest.fn().mockResolvedValue({ id: "restored-header" }),
      },
      portfolioHeaderTranslation: { upsert: jest.fn() },
    };
    await restorePortfolioFaq(
      createTrpcTestContext({ db }).db,
      "target-owner",
      { en: "new-en", es: "new-es", nl: "new-nl" },
      JSON.parse(JSON.stringify(exported)),
    );
    expect(db.portfolioHeader.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "target-owner" } }),
    );
    expect(db.portfolioHeaderTranslation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { faqItems: items },
        create: {
          portfolioHeaderId: "restored-header",
          appLanguageId: "new-nl",
          faqItems: items,
        },
      }),
    );
    expect(db.portfolioHeaderTranslation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { faqItems: [] },
        create: {
          portfolioHeaderId: "restored-header",
          appLanguageId: "new-en",
          faqItems: [],
        },
      }),
    );
    expect(db.portfolioHeaderTranslation.upsert).toHaveBeenCalledTimes(2);
  });

  it("leaves existing FAQ untouched for an empty seed catalog", async () => {
    const db = { portfolioHeader: { upsert: jest.fn() } };
    await restorePortfolioFaq(
      createTrpcTestContext({ db }).db,
      "target-owner",
      { en: "en", es: "es", nl: "nl" },
      { translations: [] },
    );
    expect(db.portfolioHeader.upsert).not.toHaveBeenCalled();
  });

  it("exports only the signed-in owner's questions", async () => {
    const db = {
      portfolioHeader: { findUnique: jest.fn().mockResolvedValue(header) },
      appLanguage: { findMany: jest.fn().mockResolvedValue(languages) },
    };
    const caller = createRouterCaller(
      seedExportRouter,
      createTrpcTestContext({ db }),
    );
    const result = await caller.faq();
    expect(result.fileName).toBe("portfolio-faq.json");
    expect(JSON.parse(result.json)).toEqual(serializeFaq(header, languages));
    expect(db.portfolioHeader.findUnique).toHaveBeenCalledWith({
      where: { userId: MOCK_OWNER_USER.id },
      include: { translations: true },
    });
  });

  it("rejects anonymous exports", async () => {
    const caller = createRouterCaller(
      seedExportRouter,
      createTrpcTestContext({ db: {}, user: null }),
    );
    await expect(caller.faq()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
