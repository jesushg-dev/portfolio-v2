import { test, expect } from "@playwright/test";

import { ensurePortfolioSkills } from "./helpers/ensure-portfolio-skills";
import {
  cleanupUserProjects,
  fillProjectForm,
  goToProjectsList,
  portfolioProjects,
  projectListTitle,
} from "./helpers/fill-project-form";

test.setTimeout(45 * 60 * 1000);

test.describe.configure({ mode: "serial" });

test.describe("projects create", () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "e2e/.auth/user.json",
    });
    const page = await context.newPage();
    await cleanupUserProjects(page);
    await ensurePortfolioSkills(page);
    await context.close();
  });

  test("creates all portfolio projects from the shared fixture", async ({
    page,
  }) => {
    await page.goto("/admin");

    for (const project of portfolioProjects) {
      await fillProjectForm(page, project, { verifyInList: false });
    }

    await goToProjectsList(page);
    await page.goto("/admin/projects?perPage=100");
    for (const project of portfolioProjects) {
      await expect(
        page
          .locator("table tbody tr")
          .filter({
            has: page.getByText(projectListTitle(project), { exact: true }),
          })
          .first(),
      ).toBeVisible();
    }
  });
});
