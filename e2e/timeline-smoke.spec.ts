import { test, expect } from "@playwright/test";

import { portfolioTimeline } from "./fixtures/portfolio-timeline";
import {
  cleanupUserTimeline,
  fillTimelineSmoke,
  getTimelineMine,
} from "./helpers/fill-timeline-form";

test.describe("timeline smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupUserTimeline(page);
  });

  test("creates one timeline entry from the shared fixture", async ({
    page,
  }) => {
    const item = portfolioTimeline.items[0];
    if (!item) {
      throw new Error("portfolio-timeline fixture has no items");
    }

    await page.goto("/admin");
    await fillTimelineSmoke(page, item);

    const items = await getTimelineMine(page);
    expect(items).toHaveLength(1);
    expect(items[0]?.organization).toBe(item.organization);
    expect(items[0]?.category).toBe(item.category);
  });
});
