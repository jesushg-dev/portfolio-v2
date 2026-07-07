import { test, expect } from "@playwright/test";

import {
  cleanupUserSkills,
  fillSkillForm,
  portfolioSkills,
} from "./helpers/fill-skill-form";

test.describe("skills smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupUserSkills(page);
  });

  test("creates one portfolio skill from the shared fixture", async ({
    page,
  }) => {
    await page.goto("/admin");

    const skill = portfolioSkills[0];
    if (!skill) {
      throw new Error("portfolio-skills fixture is empty");
    }

    await fillSkillForm(page, skill);
    await expect(page.getByRole("cell", { name: skill.title })).toBeVisible();
  });
});
