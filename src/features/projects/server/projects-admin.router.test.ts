import { projectsAdminRouter } from "./projects-admin.router";
import { CaseStudyContentSchema } from "../lib/case-study";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

const languages = [{ id: "lang-en", code: "en" }];

const row = {
  id: "pr-1",
  image: "https://cdn.example/p.png",
  type: "FRONTEND",
  githubUrl: null,
  websiteUrl: null,
  isPrivate: false,
  order: 0,
  kind: "PERSONAL",
  slug: "eleven",
  caseStudyEnabled: false,
  userId: MOCK_OWNER_USER.id,
  ProjectTranslation: [
    {
      appLanguageId: "lang-en",
      title: "Eleven",
      description: "App",
    },
  ],
  ProjectSkill: [],
};

function createDb() {
  return {
    project: {
      findMany: jest.fn().mockResolvedValue([row]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(row),
      create: jest.fn().mockResolvedValue(row),
      update: jest.fn(),
      delete: jest.fn().mockResolvedValue(row),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    projectSkill: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    projectTranslation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn<unknown, [unknown]>(),
    },
    appLanguage: { findMany: jest.fn().mockResolvedValue(languages) },
  };
}

describe("projectsAdminRouter", () => {
  it("lists and creates a project", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      projectsAdminRouter,
      createTrpcTestContext({ db }),
    );
    const list = await caller.getMine({
      page: 1,
      perPage: 10,
      sort: [{ id: "type", desc: false }],
      filters: [
        {
          id: "title",
          value: "Eleven",
          variant: "text",
          operator: "iLike",
          filterId: "f1",
        },
      ],
    });
    expect(list.data[0]?.translations["lang-en"]?.title).toBe("Eleven");

    await caller.createItem({
      image: "https://cdn.example/p.png",
      type: "FRONTEND",
      isPrivate: false,
      skillIds: ["sk-1"],
      order: 0,
      kind: "PERSONAL",
      caseStudyEnabled: false,
      translations: {
        "lang-en": {
          title: "Eleven",
          description: "App",
        },
      },
    });
    expect(db.project.create).toHaveBeenCalled();
  });

  it("saves structured narrative and unsets content when it is cleared", async () => {
    const db = createDb();
    db.projectTranslation.findFirst.mockResolvedValue({ id: "translation-1" });
    const caller = createRouterCaller(
      projectsAdminRouter,
      createTrpcTestContext({ db }),
    );
    const caseStudy = CaseStudyContentSchema.parse({
      gallery: [{ image: "/preview.jpg" }],
      sections: [
        {
          key: "approach",
          title: "Approach",
          kind: "CARDS",
          lead: "Design choice",
        },
      ],
    });
    const input = {
      id: row.id,
      image: row.image,
      type: "FRONTEND" as const,
      translations: {
        "lang-en": { title: "Eleven", description: "App", caseStudy },
      },
    };
    await caller.updateItem(input);
    expect(db.projectTranslation.update.mock.lastCall?.[0]).toMatchObject({
      where: { id: "translation-1" },
      data: {
        title: "Eleven",
        description: "App",
        caseStudy: { set: { sections: [{ lead: "Design choice" }] } },
      },
    });
    await caller.updateItem({
      ...input,
      translations: {
        "lang-en": {
          title: "Eleven",
          description: "App",
          caseStudy: CaseStudyContentSchema.parse({}),
        },
      },
    });
    expect(db.projectTranslation.update).toHaveBeenLastCalledWith({
      where: { id: "translation-1" },
      data: { title: "Eleven", description: "App", caseStudy: { unset: true } },
    });
  });
});
