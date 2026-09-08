import { softSkillsAdminRouter } from "./soft-skills-admin.router";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";
import { DEFAULT_SOFT_SKILLS_VIDEO_URL } from "@/features/soft-skills/lib/soft-skills-media";

const languages = [{ id: "lang-en", code: "en" }];

const skill = {
  id: "ss-1",
  icon: "RiTeamLine",
  isVisible: true,
  featured: false,
  order: 0,
  userId: MOCK_OWNER_USER.id,
  PortfolioSoftSkillTranslation: [
    {
      appLanguageId: "lang-en",
      title: "Collaboration",
      description: "Works well",
      badge: "Lead",
    },
  ],
};

const section = {
  id: "sec-1",
  userId: MOCK_OWNER_USER.id,
  mediaType: "VIDEO",
  videoUrl: DEFAULT_SOFT_SKILLS_VIDEO_URL,
  posterUrl: "https://cdn.example/poster.webp",
  imageUrl: null,
};

function createDb() {
  return {
    appLanguage: { findMany: jest.fn().mockResolvedValue(languages) },
    portfolioSoftSkill: {
      findMany: jest.fn().mockResolvedValue([skill]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(skill),
      create: jest.fn().mockResolvedValue(skill),
      update: jest.fn().mockResolvedValue(skill),
      delete: jest.fn().mockResolvedValue(skill),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    portfolioSoftSkillTranslation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    softSkillsSection: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(section),
      upsert: jest.fn().mockResolvedValue(section),
    },
  };
}

describe("softSkillsAdminRouter", () => {
  it("lists soft skills and creates a default section", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      softSkillsAdminRouter,
      createTrpcTestContext({ db }),
    );
    const listed = await caller.getMine({
      page: 1,
      perPage: 10,
      sort: [{ id: "order", desc: false }],
      filters: [
        {
          id: "title",
          value: "Collab",
          variant: "text",
          operator: "iLike",
          filterId: "f1",
        },
      ],
    });
    expect(listed.data[0]?.translations["lang-en"]?.title).toBe(
      "Collaboration",
    );

    const createdSection = await caller.getSection();
    expect(createdSection.mediaType).toBe("VIDEO");
    expect(db.softSkillsSection.create).toHaveBeenCalled();
  });

  it("creates, updates, and deletes an item", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      softSkillsAdminRouter,
      createTrpcTestContext({ db }),
    );
    await caller.createItem({
      icon: "RiTeamLine",
      isVisible: true,
      featured: false,
      order: 0,
      translations: {
        "lang-en": {
          title: "Collaboration",
          description: "Works well",
          badge: "Lead",
        },
      },
    });
    await caller.updateItem({
      id: "ss-1",
      icon: "RiTeamLine",
      isVisible: true,
      featured: true,
      order: 1,
      translations: {
        "lang-en": {
          title: "Collaboration",
          description: "Updated",
          badge: "Lead",
        },
      },
    });
    await caller.deleteItem({ id: "ss-1" });
    expect(db.portfolioSoftSkill.delete).toHaveBeenCalled();
  });

  it("deletes all items and upserts the section", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      softSkillsAdminRouter,
      createTrpcTestContext({ db }),
    );
    await caller.deleteAll();
    await caller.upsertSection({
      mediaType: "IMAGE",
      imageUrl: "https://cdn.example/soft.png",
      videoUrl: "",
      posterUrl: "",
    });
    expect(db.softSkillsSection.upsert).toHaveBeenCalled();
  });
});
