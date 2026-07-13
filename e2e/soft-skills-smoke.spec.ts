import { test, expect } from "@playwright/test";

import { portfolioSoftSkills } from "./fixtures/portfolio-soft-skills";
import {
  cleanupUserSoftSkills,
  fillSoftSkillSmoke,
  getSoftSkillsMine,
} from "./helpers/fill-soft-skills-form";

test.describe("soft skills smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupUserSoftSkills(page);
  });

  test("creates one soft skill from the shared fixture", async ({ page }) => {
    const item = portfolioSoftSkills.items[0];
    if (!item) {
      throw new Error("portfolio-soft-skills fixture has no items");
    }

    await page.goto("/admin");
    await fillSoftSkillSmoke(page, item);

    const items = await getSoftSkillsMine(page);
    expect(items.data).toHaveLength(1);
    expect(items.data[0]?.icon).toBe(item.icon);
    expect(items.data[0]?.order).toBe(item.order);
  });
});
