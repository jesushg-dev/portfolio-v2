import { test, expect } from "@playwright/test";
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
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: getWorkerAuthFile(),
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
    expect(items.length).toBeGreaterThanOrEqual(portfolioSoftSkills.items.length);

    const teamwork = items.find((row) =>
      softSkillHasTranslationTitle(row, "Teamwork"),
    );
    expect(teamwork).toBeDefined();
    expect(teamwork?.icon).toBe("RiTeamLine");
    expect(teamwork?.order).toBe(0);

    const leadership = items.find((row) =>
      softSkillHasTranslationTitle(row, "Leadership"),
    );
    expect(leadership).toBeDefined();
    expect(leadership?.icon).toBe("RiHandHeartLine");

    const orders = items.map((row) => row.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});
