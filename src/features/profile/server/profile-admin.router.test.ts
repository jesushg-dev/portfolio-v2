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
      degree: "First Programmer",
      heroSubtitle: "First Programmer",
      heroTagline: "Writing the first computer algorithm in history.",
      heroSummary: "Builder",
      availabilityBadge: "Available for hire",
      clientImageAlt: "Portrait of Ada",
    },
  ],
};

const aboutMe = {
  id: "about-1",
  userId: MOCK_OWNER_USER.id,
  translations: [{ appLanguageId: "lang-en", aboutMe: "I build things." }],
};

function createDb() {
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
  };
}

describe("profileAdminRouter", () => {
  it("returns a modern hero editor DTO with subtitle and tagline", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      profileAdminRouter,
      createTrpcTestContext({ db }),
    );
    const editor = await caller.getHeroEditor();
    expect(editor.fullName).toBe("Ada Lovelace");
    expect(editor.heroSubtitleTranslations["lang-en"]?.text).toBe(
      "First Programmer",
    );
    expect(editor.heroTaglineTranslations["lang-en"]?.text).toBe(
      "Writing the first computer algorithm in history.",
    );
    expect(editor.heroSummaryTranslations["lang-en"]?.text).toBe("Builder");
    expect(editor.clientImageAltTranslations["lang-en"]?.text).toBe(
      "Portrait of Ada",
    );
    expect(editor.heroBadgeTranslations["lang-en"]?.text).toBe(
      "Available for hire",
    );
  });

  it("upserts the modern hero including subtitle and tagline", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      profileAdminRouter,
      createTrpcTestContext({ db }),
    );
    const result = await caller.upsertHero({
      fullName: "Ada Lovelace",
      photoUrl: "https://cdn.example/ada.png",
      heroSubtitleTranslations: {
        "lang-en": { text: "Senior Software Engineer" },
      },
      heroTaglineTranslations: {
        "lang-en": { text: "Scaling systems worldwide." },
      },
      heroSummaryTranslations: { "lang-en": { text: "Builder" } },
      clientImageAltTranslations: { "lang-en": { text: "Portrait" } },
    });
    expect(result.fullName).toBe("Ada Lovelace");
    expect(db.cvHeader.upsert).toHaveBeenCalled();
  });

  it("returns about editor DTO with narrative copy", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      profileAdminRouter,
      createTrpcTestContext({ db }),
    );
    const about = await caller.getAboutEditor();
    expect(about.aboutMeTranslations["lang-en"]?.text).toBe("I build things.");
  });

  it("upserts about narrative copy", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      profileAdminRouter,
      createTrpcTestContext({ db }),
    );
    const result = await caller.upsertAbout({
      aboutMeTranslations: {
        "lang-en": {
          text: "I architect high-performance distributed systems.",
        },
      },
    });
    expect(db.cvAboutMe.upsert).toHaveBeenCalled();
    expect(result.aboutMeTranslations).toBeDefined();
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
      heroSubtitle: { "lang-en": { text: "Mathematician" } },
      heroTagline: { "lang-en": { text: "First programmer." } },
      heroSummary: { "lang-en": { text: "Builder" } },
      clientImageAlt: { "lang-en": { text: "Portrait" } },
    });
    expect(result.fullName).toBe("Ada Lovelace");
    expect(db.cvHeaderTranslation.create).toHaveBeenCalled();
  });
});
