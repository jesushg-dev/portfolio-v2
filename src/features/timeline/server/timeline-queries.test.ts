jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

jest.mock("@/lib/admin/get-authenticated-user-id", () => ({
  requireAuthenticatedUserId: jest.fn(),
}));

jest.mock("@/server/db", () => ({
  db: {
    appLanguage: { findMany: jest.fn() },
    timelineItem: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import { db } from "@/server/db";
import {
  getTimelineCreatePageData,
  getTimelineEditPageData,
  getUserTimelineWithLanguages,
} from "./timeline-queries";

const languages = [{ id: "lang-en", code: "en" }];
const item = {
  id: "item-1",
  order: 0,
  organization: "Acme Corp",
  location: "New York",
  category: "WORK",
  startDate: new Date("2020-01-01"),
  endDate: new Date("2022-06-30"),
  current: false,
  images: [],
  userId: "user-1",
  createdAt: new Date("2020-01-01"),
  updatedAt: new Date("2022-06-30"),
  TimelineItemTranslation: [
    {
      appLanguageId: "lang-en",
      title: "Engineer",
      description: "Built stuff",
    },
  ],
};

describe("timeline-queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(requireAuthenticatedUserId).mockResolvedValue("user-1");
    jest.mocked(db.appLanguage.findMany).mockResolvedValue(languages as never);
  });

  it("returns an empty create DTO", async () => {
    const result = await getTimelineCreatePageData();
    expect(result.initialData.organization).toBe("");
  });

  it("loads and lists timeline items", async () => {
    jest.mocked(db.timelineItem.findUnique).mockResolvedValue(item as never);
    jest.mocked(db.timelineItem.findMany).mockResolvedValue([item] as never);
    jest.mocked(db.timelineItem.count).mockResolvedValue(1);

    const editor = await getTimelineEditPageData("item-1");
    expect(editor.formDto.organization).toBe("Acme Corp");

    const listed = await getUserTimelineWithLanguages({
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
        {
          id: "category",
          value: "WORK",
          variant: "select",
          operator: "eq",
          filterId: "f2",
        },
      ],
    });
    expect(listed.totalCount).toBe(1);
  });

  it("throws when the item is missing", async () => {
    jest.mocked(db.timelineItem.findUnique).mockResolvedValue(null);
    await expect(getTimelineEditPageData("missing")).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
