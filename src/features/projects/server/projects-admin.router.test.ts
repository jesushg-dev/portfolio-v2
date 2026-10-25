import { projectsAdminRouter } from "./projects-admin.router";
import { CaseStudyContentSchema } from "../lib/case-study";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

const languages = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
];

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
  const db = {
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
      deleteMany: jest.fn(),
    },
    certificateProject: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    skill: {
      count: jest.fn(({ where }: { where: { id: { in: string[] } } }) =>
        Promise.resolve(where.id.in.length),
      ),
    },
    certification: {
      count: jest.fn(({ where }: { where: { id: { in: string[] } } }) =>
        Promise.resolve(where.id.in.length),
      ),
    },
    appLanguage: { findMany: jest.fn().mockResolvedValue(languages) },
  };
  return {
    ...db,
    $transaction: jest.fn(
      async (callback: (tx: typeof db) => Promise<unknown>) => callback(db),
    ),
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

  it("removes empty translations during an atomic update", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      projectsAdminRouter,
      createTrpcTestContext({ db }),
    );
    await caller.updateItem({
      id: row.id,
      image: row.image,
      type: "FRONTEND",
      translations: {
        "lang-en": { title: "Eleven", description: "App" },
        "lang-es": { title: "", description: "" },
      },
    });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.projectTranslation.deleteMany).toHaveBeenCalledWith({
      where: { projectId: row.id, appLanguageId: { notIn: ["lang-en"] } },
    });
    expect(db.projectTranslation.create).toHaveBeenCalledTimes(1);
  });

  it("rejects certificates owned by another user", async () => {
    const db = createDb();
    db.certification.count.mockResolvedValue(0);
    const caller = createRouterCaller(
      projectsAdminRouter,
      createTrpcTestContext({ db }),
    );
    await expect(
      caller.createItem({
        image: row.image,
        type: "FRONTEND",
        certificateIds: ["foreign-cert"],
        translations: {
          "lang-en": { title: "Eleven", description: "App" },
        },
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.project.create).not.toHaveBeenCalled();
  });

  it("deletes multiple projects belonging to the user", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      projectsAdminRouter,
      createTrpcTestContext({ db }),
    );
    const result = await caller.deleteMany({ ids: [row.id] });
    expect(result).toEqual({ count: 1 });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.project.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [row.id] } },
    });
  });
});
