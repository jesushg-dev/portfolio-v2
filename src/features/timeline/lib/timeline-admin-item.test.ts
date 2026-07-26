import { readTimelineImages, type TimelineAdminItem } from "./timeline-admin-item";

describe("readTimelineImages", () => {
  it("returns images array when images property is defined", () => {
    const item = { images: ["https://example.com/1.jpg"] } as unknown as TimelineAdminItem;
    expect(readTimelineImages(item)).toEqual(["https://example.com/1.jpg"]);
  });

  it("returns empty array when images property is null or undefined", () => {
    const itemNull = { images: null } as unknown as TimelineAdminItem;
    expect(readTimelineImages(itemNull)).toEqual([]);

    const itemUndefined = {} as unknown as TimelineAdminItem;
    expect(readTimelineImages(itemUndefined)).toEqual([]);
  });
});
