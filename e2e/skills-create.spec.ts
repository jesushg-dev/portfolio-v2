import { expect, test } from "./authenticated-test";
import { getWorkerAuthFile } from "./helpers/auth-state";

import {
  cleanupUserSkills,
  fillSkillForm,
  goToSkillsList,
  portfolioSkills,
} from "./helpers/fill-skill-form";
import {
  disconnectE2ePrisma,
  ensureAppLanguages,
} from "./helpers/ensure-app-languages";

// ~1 min/skill in headed mode; 42 skills need well above the default 60s test timeout.
test.setTimeout(45 * 60 * 1000);

test.describe.configure({ mode: "serial" });

test.describe("skills create", () => {
  test.beforeAll(async ({ browser }, testInfo) => {
    await ensureAppLanguages();

    const context = await browser.newContext({
      storageState: getWorkerAuthFile(testInfo.workerIndex),
    });
    const page = await context.newPage();
    await cleanupUserSkills(page);
    await context.close();
  });

  test.afterAll(async () => {
    await disconnectE2ePrisma();
  });

  test("creates all 42 portfolio skills from the shared fixture", async ({
    page,
  }) => {
    await page.goto("/admin");

    for (const skill of portfolioSkills) {
      await fillSkillForm(page, skill, { verifyInList: false });
    }

    await goToSkillsList(page);
    await page.goto("/admin/skills?perPage=100");
    for (const skill of portfolioSkills) {
      await expect(
        page.getByRole("cell", { name: skill.title, exact: true }),
      ).toBeVisible();
    }
  });
});
