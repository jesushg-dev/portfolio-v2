import { timelineAdminRouter } from "./timeline-admin.router";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

const languages = [{ id: "lang-en", code: "en" }];

const row = {
  id: "tl-1",
  organization: "Acme",
  location: "Remote",
  category: "WORK",
  startDate: new Date("2020-01-01"),
  endDate: new Date("2022-01-01"),
  current: false,
  images: [],
  userId: MOCK_OWNER_USER.id,
  createdAt: new Date(),
  updatedAt: new Date(),
  TimelineItemTranslation: [
    {
      appLanguageId: "lang-en",
      title: "Engineer",
      description: "Built stuff",
    },
  ],
};

function createDb() {
  return {
    timelineItem: {
      findMany: jest.fn().mockResolvedValue([row]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(row),
      create: jest.fn().mockResolvedValue(row),
      update: jest.fn(),
      delete: jest.fn().mockResolvedValue(row),
    },
    timelineItemTranslation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    },
    appLanguage: { findMany: jest.fn().mockResolvedValue(languages) },
  };
}

describe("timelineAdminRouter", () => {
  it("lists and creates timeline items", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      timelineAdminRouter,
      createTrpcTestContext({ db }),
    );
    const list = await caller.getMine({
      page: 1,
      perPage: 10,
      sort: [{ id: "organization", desc: false }],
      filters: [
        {
          id: "organization",
          value: "Acme",
          variant: "text",
          operator: "iLike",
          filterId: "f1",
        },
      ],
    });
    expect(list.data[0]?.organization).toBe("Acme");

    await caller.createItem({
      organization: "Acme",
      location: "Remote",
      category: "WORK",
      startDate: new Date("2020-01-01"),
      endDate: new Date("2022-01-01"),
      current: false,
      translations: {
        "lang-en": { title: "Engineer", description: "Built stuff" },
      },
    });
    expect(db.timelineItem.create).toHaveBeenCalled();
  });

  it("rejects updates for another user's item", async () => {
    const db = createDb();
    db.timelineItem.findUnique.mockResolvedValue({
      ...row,
      userId: "other",
    });
    const caller = createRouterCaller(
      timelineAdminRouter,
      createTrpcTestContext({ db }),
    );
    await expect(
      caller.updateItem({
        id: "tl-1",
        organization: "Acme",
        category: "WORK",
        startDate: new Date("2020-01-01"),
        current: false,
        translations: {
          "lang-en": { title: "Engineer", description: "Built stuff" },
        },
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
