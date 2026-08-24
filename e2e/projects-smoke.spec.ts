import { expect, test } from "./authenticated-test";

import { ensurePortfolioSkills } from "./helpers/ensure-portfolio-skills";
import {
  cleanupUserProjects,
  fillProjectForm,
  portfolioProjects,
  projectListTitle,
} from "./helpers/fill-project-form";

test.describe("projects smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupUserProjects(page);
    await ensurePortfolioSkills(page);
  });

  test("creates one portfolio project from the shared fixture", async ({
    page,
  }) => {
    await page.goto("/admin");

    const project = portfolioProjects[0];
    if (!project) {
      throw new Error("portfolio-projects fixture is empty");
    }

    await fillProjectForm(page, project);
    await expect(
      page
        .locator("table tbody tr")
        .filter({
          has: page.getByText(projectListTitle(project), { exact: true }),
        })
        .first(),
    ).toBeVisible();
  });
});
