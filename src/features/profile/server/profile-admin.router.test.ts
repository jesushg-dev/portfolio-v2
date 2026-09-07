import { profileAdminRouter } from "./profile-admin.router";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

const languages = [{ id: "lang-en", code: "en" }];

const header = {
  id: "hdr-1",
  userId: MOCK_OWNER_USER.id,
  fullName: "Ada Lovelace",
  photoUrl: "https://cdn.example/ada.png",
  backgroundImageUrl: null,
  translations: [
    {
      id: "ht-1",
      appLanguageId: "lang-en",
      heroSummary: "Builder",
      clientImageAlt: "Portrait",
    },
  ],
};

const aboutMe = {
  id: "about-1",
  userId: MOCK_OWNER_USER.id,
  translations: [{ appLanguageId: "lang-en", aboutMe: "I build things." }],
};

function createDb() {
  const tx = {
    cvHeroTitle: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  };
  return {
    appLanguage: { findMany: jest.fn().mockResolvedValue(languages) },
    cvHeader: {
      findUnique: jest.fn().mockResolvedValue(header),
      upsert: jest.fn().mockResolvedValue(header),
    },
    cvHeaderTranslation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    },
    cvAboutMe: {
      findUnique: jest.fn().mockResolvedValue(aboutMe),
      upsert: jest.fn().mockResolvedValue(aboutMe),
    },
    cvAboutMeTranslation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    },
    cvHeroTitle: {
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(async (fn: (client: typeof tx) => unknown) =>
      await fn(tx),
    ),
  };
}

describe("profileAdminRouter", () => {
  it("returns a hero editor DTO with a placeholder title", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      profileAdminRouter,
      createTrpcTestContext({ db }),
    );
    const editor = await caller.getHeroEditor();
    expect(editor.fullName).toBe("Ada Lovelace");
    expect(editor.heroSummaryTranslations["lang-en"]?.text).toBe("Builder");
    expect(editor.titles).toHaveLength(1);
  });

  it("upserts the full hero including about-me copy", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      profileAdminRouter,
      createTrpcTestContext({ db }),
    );
    const result = await caller.upsertHero({
      fullName: "Ada Lovelace",
      photoUrl: "https://cdn.example/ada.png",
      backgroundImageUrl: "",
      heroSummaryTranslations: { "lang-en": { text: "Builder" } },
      clientImageAltTranslations: { "lang-en": { text: "Portrait" } },
      aboutMeTranslations: { "lang-en": { text: "I build things." } },
      titles: [{ order: 0, translations: { "lang-en": { text: "Engineer" } } }],
    });
    expect(result.fullName).toBe("Ada Lovelace");
    expect(db.cvHeader.upsert).toHaveBeenCalled();
    expect(db.cvAboutMe.upsert).toHaveBeenCalled();
  });

  it("replaces hero titles in a transaction", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      profileAdminRouter,
      createTrpcTestContext({ db }),
    );
    await caller.upsertHeroTitlesOnly({
      titles: [
        { order: 1, translations: { "lang-en": { text: "Engineer" } } },
        { order: 0, translations: { "lang-en": { text: "   " } } },
      ],
    });
    expect(db.$transaction).toHaveBeenCalled();
  });

  it("upserts the portfolio header translations", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      profileAdminRouter,
      createTrpcTestContext({ db }),
    );
    const result = await caller.upsertPortfolioHeader({
      fullName: "Ada Lovelace",
      photoUrl: "https://cdn.example/ada.png",
      backgroundImageUrl: null,
      heroSummary: { "lang-en": { text: "Builder" } },
      clientImageAlt: { "lang-en": { text: "Portrait" } },
    });
    expect(result.fullName).toBe("Ada Lovelace");
    expect(db.cvHeaderTranslation.create).toHaveBeenCalled();
  });
});
