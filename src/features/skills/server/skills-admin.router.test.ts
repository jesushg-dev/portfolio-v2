import { TRPCError } from "@trpc/server";

import { skillsAdminRouter } from "./skills-admin.router";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

const languages = [{ id: "lang-en", code: "en" }];

const skillRow = {
  id: "sk-1",
  title: "React",
  image: "https://cdn.example/react.png",
  type: "FRONTEND",
  featured: false,
  userId: MOCK_OWNER_USER.id,
  SkillTranslation: [],
  _count: { ProjectSkill: 0, CertificateSkill: 0 },
};

function createDb(overrides: Record<string, unknown> = {}) {
  return {
    skill: {
      findMany: jest.fn().mockResolvedValue([skillRow]),
      count: jest.fn().mockResolvedValue(1),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(skillRow),
      create: jest.fn().mockResolvedValue(skillRow),
      update: jest.fn().mockResolvedValue(skillRow),
    },
    skillTranslation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    },
    appLanguage: {
      findMany: jest.fn().mockResolvedValue(languages),
    },
    $transaction: jest.fn(
      async (fn: (tx: unknown) => unknown) =>
        await fn({
          projectSkill: { deleteMany: jest.fn() },
          certificateSkill: { deleteMany: jest.fn() },
          serviceSkill: { deleteMany: jest.fn() },
          cvExperienceSkill: { deleteMany: jest.fn() },
          skillTranslation: { deleteMany: jest.fn() },
          skill: {
            delete: jest.fn().mockResolvedValue(skillRow),
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        }),
    ),
    ...overrides,
  };
}

describe("skillsAdminRouter", () => {
  it("lists skills with pagination", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      skillsAdminRouter,
      createTrpcTestContext({ db }),
    );
    const result = await caller.getMine({
      page: 1,
      perPage: 10,
      sort: [{ id: "title", desc: false }],
      filters: [
        {
          id: "title",
          value: "Re",
          variant: "text",
          operator: "iLike",
          filterId: "f1",
        },
      ],
    });
    expect(result.totalCount).toBe(1);
    expect(result.data[0]?.title).toBe("React");
  });

  it("creates a skill", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      skillsAdminRouter,
      createTrpcTestContext({ db }),
    );
    const created = await caller.createItem({
      title: "React",
      image: "https://cdn.example/react.png",
      type: "FRONTEND",
      featured: false,
      translations: {},
    });
    expect(created.title).toBe("React");
    expect(db.skill.create).toHaveBeenCalled();
  });

  it("rejects duplicate titles on create", async () => {
    const db = createDb({
      skill: {
        ...createDb().skill,
        findFirst: jest.fn().mockResolvedValue({ id: "sk-1" }),
      },
    });
    const caller = createRouterCaller(
      skillsAdminRouter,
      createTrpcTestContext({ db }),
    );
    await expect(
      caller.createItem({
        title: "React",
        image: "https://cdn.example/react.png",
        type: "FRONTEND",
        featured: false,
        translations: {},
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("updates, then deletes a skill", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      skillsAdminRouter,
      createTrpcTestContext({ db }),
    );
    await caller.updateItem({
      id: "sk-1",
      title: "React",
      image: "https://cdn.example/react.png",
      type: "FRONTEND",
      featured: true,
      translations: {
        "lang-en": { description: "UI", urlWiki: "" },
      },
    });
    await expect(caller.deleteItem({ id: "sk-1" })).resolves.toBeDefined();
  });

  it("deleteAll is a no-op when the owner has no skills", async () => {
    const db = createDb({
      skill: {
        ...createDb().skill,
        findMany: jest.fn().mockResolvedValue([]),
      },
    });
    const caller = createRouterCaller(
      skillsAdminRouter,
      createTrpcTestContext({ db }),
    );
    await expect(caller.deleteAll()).resolves.toEqual({ count: 0 });
  });
});
