import { expect, test } from "./authenticated-test";

import {
  cleanupUserProfile,
  fillProfileHeroSmoke,
  getHeroEditor,
  portfolioHome,
} from "./helpers/fill-profile-form";

test.describe("profile smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupUserProfile(page);
  });

  test("saves one hero title and summary from the shared fixture", async ({
    page,
  }) => {
    const title = portfolioHome.heroSubtitle;

    await page.goto("/admin");
    await fillProfileHeroSmoke(page, title);

    await expect
      .poll(async () => {
        const hero = await getHeroEditor(page);
        return Object.values(hero.heroSubtitleTranslations).some(
          (translation) => translation.text === title.en,
        );
      })
      .toBe(true);
  });
});
