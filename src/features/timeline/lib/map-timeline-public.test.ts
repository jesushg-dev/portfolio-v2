import type { TimelineItem } from "@prisma/client";

import {
  formatTimelineDate,
  groupTimelineByYear,
  mapTimelineItemToPublic,
  mapTimelineItemsToPublic,
} from "./map-timeline-public";

const baseItem: TimelineItem = {
  id: "item-1",
  userId: "user-1",
  title: {
    default: "Web Developer",
    translations: { es: "Desarrollador Web" },
  },
  description: {
    default: "Built web apps",
    translations: { es: "Construí apps web" },
  },
  category: "WORK",
  organization: "Acme",
  location: "Remote",
  startDate: new Date("2022-06-01T00:00:00.000Z"),
  endDate: null,
  current: true,
  order: 0,
  images: ["https://example.com/photo.jpg"],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("formatTimelineDate", () => {
  it("formats current roles", () => {
    expect(
      formatTimelineDate(new Date("2022-06-01T12:00:00.000Z"), null, true),
    ).toBe("2022 - Present");
  });

  it("formats completed ranges", () => {
    expect(
      formatTimelineDate(
        new Date("2020-06-01T12:00:00.000Z"),
        new Date("2021-12-01T12:00:00.000Z"),
        false,
      ),
    ).toBe("2020 - 2021");
  });
});

describe("mapTimelineItemToPublic", () => {
  it("resolves locale with fallback", () => {
    const item = mapTimelineItemToPublic(baseItem, "es", "en");
    expect(item.title).toBe("Desarrollador Web - Acme");
    expect(item.description).toBe("Construí apps web");
    expect(item.images).toEqual(["https://example.com/photo.jpg"]);
  });

  it("falls back to default locale", () => {
    const item = mapTimelineItemToPublic(baseItem, "nl", "en");
    expect(item.title).toBe("Web Developer - Acme");
  });
});

describe("mapTimelineItemsToPublic", () => {
  it("applies limit", () => {
    const items = mapTimelineItemsToPublic(
      [
        baseItem,
        { ...baseItem, id: "item-2", order: 1 },
        { ...baseItem, id: "item-3", order: 2 },
      ],
      "en",
      "en",
      2,
    );

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.id)).toEqual(["item-1", "item-2"]);
  });
});

describe("groupTimelineByYear", () => {
  it("groups items by start year descending", () => {
    const groups = groupTimelineByYear([
      mapTimelineItemToPublic(baseItem, "en"),
      mapTimelineItemToPublic(
        {
          ...baseItem,
          id: "item-2",
          startDate: new Date("2020-06-01T12:00:00.000Z"),
        },
        "en",
      ),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.year).toBe(2022);
    expect(groups[1]?.year).toBe(2020);
  });
});
