import { projectsAdminRouter } from "./projects-admin.router";
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
      hook: "",
      challenge: "",
      approach: "",
      outcome: "",
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
      update: jest.fn(),
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
          hook: "",
          challenge: "",
          approach: "",
          outcome: "",
        },
      },
    });
    expect(db.project.create).toHaveBeenCalled();
  });
});
