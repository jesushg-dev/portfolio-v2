import { expect, test } from "./authenticated-test";
import { getWorkerAuthFile } from "./helpers/auth-state";

import { portfolioSoftSkills } from "./fixtures/portfolio-soft-skills";
import {
  cleanupUserSoftSkills,
  fillSoftSkillsFromFixture,
  getSoftSkillsMine,
  getSoftSkillsSection,
  softSkillHasTranslationTitle,
} from "./helpers/fill-soft-skills-form";

test.setTimeout(30 * 60 * 1000);

test.describe.configure({ mode: "serial" });

test.describe("soft skills create", () => {
  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      storageState: getWorkerAuthFile(testInfo.workerIndex),
    });
    const page = await context.newPage();
    await cleanupUserSoftSkills(page);
    await context.close();
  });

  test("creates section settings and all soft skills from the shared fixture", async ({
    page,
  }) => {
    await page.goto("/admin");
    await fillSoftSkillsFromFixture(page);

    const section = await getSoftSkillsSection(page);
    expect(section.mediaType).toBe(portfolioSoftSkills.section.mediaType);
    expect(section.videoUrl).toBe(portfolioSoftSkills.section.videoUrl);
    expect(section.posterUrl).toBe(portfolioSoftSkills.section.posterUrl);

    await page.waitForTimeout(1_000);
    const response = await getSoftSkillsMine(page);
    const items = response.data;
    expect(items.length).toBeGreaterThanOrEqual(
      portfolioSoftSkills.items.length,
    );

    const firstFixture = portfolioSoftSkills.items[0];
    const firstItem = items.find((row) =>
      softSkillHasTranslationTitle(row, firstFixture.title.en),
    );
    expect(firstItem).toBeDefined();
    expect(firstItem?.icon).toBe(firstFixture.icon);
    expect(firstItem?.order).toBe(firstFixture.order);

    const secondFixture = portfolioSoftSkills.items[1];
    const secondItem = items.find((row) =>
      softSkillHasTranslationTitle(row, secondFixture.title.en),
    );
    expect(secondItem).toBeDefined();
    expect(secondItem?.icon).toBe(secondFixture.icon);

    const orders = items.map((row) => row.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});
