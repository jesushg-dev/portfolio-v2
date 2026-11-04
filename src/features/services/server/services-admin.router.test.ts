import { servicesAdminRouter } from "./services-admin.router";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

const languages = [{ id: "lang-en", code: "en" }];

const serviceRow = {
  id: "sv-1",
  image: "",
  type: "FRONTEND",
  icon: "code",
  statsValue: "",
  featured: false,
  isActive: true,
  order: 0,
  userId: MOCK_OWNER_USER.id,
  ServiceTranslation: [
    {
      appLanguageId: "lang-en",
      title: "Web",
      description: "Apps",
      badge: "",
      statsLabel: "",
    },
  ],
  ServiceSkill: [],
};

function createDb() {
  return {
    skill: { count: jest.fn().mockResolvedValue(1) },
    service: {
      findMany: jest.fn().mockResolvedValue([serviceRow]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(serviceRow),
      create: jest.fn().mockResolvedValue(serviceRow),
      update: jest.fn(),
      delete: jest.fn().mockResolvedValue(serviceRow),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    serviceSkill: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    serviceTranslation: {
      deleteMany: jest.fn(),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    },
    appLanguage: {
      findMany: jest.fn().mockResolvedValue(languages),
    },
  };
}

describe("servicesAdminRouter", () => {
  it("rejects another tenant's skills before writing service data", async () => {
    const db = createDb();
    db.skill.count.mockResolvedValue(0);
    const caller = createRouterCaller(
      servicesAdminRouter,
      createTrpcTestContext({ db }),
    );
    await expect(
      caller.createItem({ type: "FRONTEND", skillIds: ["foreign-skill"] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.skill.count).toHaveBeenCalledWith({
      where: { id: { in: ["foreign-skill"] }, userId: MOCK_OWNER_USER.id },
    });
    expect(db.service.create).not.toHaveBeenCalled();
    await expect(
      caller.updateItem({
        id: "sv-1",
        type: "FRONTEND",
        skillIds: ["foreign-skill"],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.service.update).not.toHaveBeenCalled();
    expect(db.serviceSkill.deleteMany).not.toHaveBeenCalled();
  });

  it("lists, creates, updates, and deletes services", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      servicesAdminRouter,
      createTrpcTestContext({ db }),
    );

    const list = await caller.getMine({
      page: 1,
      perPage: 20,
      sort: [{ id: "createdAt", desc: true }],
      filters: [
        {
          id: "title",
          value: "Web",
          variant: "text",
          operator: "iLike",
          filterId: "f1",
        },
      ],
    });
    expect(list.data[0]?.translations["lang-en"]?.title).toBe("Web");

    await caller.createItem({
      image: "",
      type: "FRONTEND",
      icon: "code",
      statsValue: "",
      featured: false,
      isActive: true,
      order: 0,
      skillIds: ["sk-1"],
      translations: {
        "lang-en": {
          title: "Web",
          description: "Apps",
          badge: "",
          statsLabel: "",
          practicePoints: "Verified tenant result",
          visualNodes: [{ label: "Tenant API" }],
        },
      },
    });
    expect(db.service.create).toHaveBeenCalled();

    await caller.updateItem({
      id: "sv-1",
      image: "",
      type: "BACKEND",
      icon: "code",
      statsValue: "10",
      featured: true,
      isActive: true,
      order: 1,
      skillIds: ["sk-2"],
      translations: {
        "lang-en": {
          title: "API",
          description: "Services",
          badge: "",
          statsLabel: "",
          practicePoints: "Verified tenant result",
          visualNodes: [{ label: "Tenant API" }],
        },
      },
    });
    expect(db.serviceSkill.createMany).toHaveBeenCalled();
    expect(db.serviceTranslation.create.mock.calls).toMatchObject([
      [{ data: { practicePoints: "Verified tenant result" } }],
    ]);
    expect(db.serviceTranslation.deleteMany).toHaveBeenCalledWith({
      where: { serviceId: "sv-1", appLanguageId: { notIn: ["lang-en"] } },
    });

    await caller.toggleActive({ id: "sv-1", isActive: false });
    expect(db.service.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sv-1" },
        data: { isActive: false },
      }),
    );

    await caller.deleteItem({ id: "sv-1" });
    await expect(caller.deleteAll()).resolves.toEqual({ count: 1 });
  });

  it("returns count 0 from deleteAll when empty", async () => {
    const db = createDb();
    db.service.findMany.mockResolvedValue([]);
    const caller = createRouterCaller(
      servicesAdminRouter,
      createTrpcTestContext({ db }),
    );
    await expect(caller.deleteAll()).resolves.toEqual({ count: 0 });
  });
});
