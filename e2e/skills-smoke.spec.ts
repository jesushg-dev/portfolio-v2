import { expect, test } from "./authenticated-test";

import {
  cleanupUserSkills,
  fillSkillForm,
  portfolioSkills,
} from "./helpers/fill-skill-form";
import {
  disconnectE2ePrisma,
  ensureAppLanguages,
} from "./helpers/ensure-app-languages";

test.describe("skills smoke", () => {
  test.beforeAll(async () => {
    await ensureAppLanguages();
  });

  test.afterAll(async () => {
    await disconnectE2ePrisma();
  });

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
    await expect(
      page.getByRole("cell", { name: skill.title, exact: true }),
    ).toBeVisible();
  });
});
