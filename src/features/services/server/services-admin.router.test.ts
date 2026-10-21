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
        },
      },
    });
    expect(db.serviceSkill.createMany).toHaveBeenCalled();

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
