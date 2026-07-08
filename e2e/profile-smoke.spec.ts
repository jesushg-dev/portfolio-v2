import { test, expect } from "@playwright/test";

import {
  cleanupUserProfile,
  fillProfileHeroSmoke,
  getHeroTitlesMine,
  portfolioHome,
} from "./helpers/fill-profile-form";

test.describe("profile smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupUserProfile(page);
  });

  test("saves one hero title and summary from the shared fixture", async ({
    page,
  }) => {
    const title = portfolioHome.heroTitles[0];
    if (!title) {
      throw new Error("portfolio-home fixture has no hero titles");
    }

    await page.goto("/admin");
    await fillProfileHeroSmoke(page, title, portfolioHome.heroSummary);

    const heroTitles = await getHeroTitlesMine(page);
    expect(heroTitles.titles).toHaveLength(1);
    expect(
      Object.values(heroTitles.titles[0]?.translationsByLangId ?? {}).some(
        (translation) => translation.text === title.en,
      ),
    ).toBe(true);
  });
});
