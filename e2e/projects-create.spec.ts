import { expect, test } from "./authenticated-test";
import { getWorkerAuthFile } from "./helpers/auth-state";

import {
  expectTitlesAcrossAdminPages,
  openAdminPagedList,
} from "./helpers/admin-paged-list";
import { ensurePortfolioSkills } from "./helpers/ensure-portfolio-skills";
import {
  cleanupUserProjects,
  fillProjectForm,
  portfolioProjects,
  projectListTitle,
} from "./helpers/fill-project-form";
import { fetchAdminTotalCount } from "./helpers/pagination";

test.setTimeout(45 * 60 * 1000);

test.describe.configure({ mode: "serial" });

test.describe("projects create", () => {
  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      storageState: getWorkerAuthFile(testInfo.workerIndex),
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

    await openAdminPagedList(page, "/admin/projects", "projects-add");
    await expect
      .poll(() => fetchAdminTotalCount(page, "projectsAdmin.getMine"), {
        timeout: 30_000,
      })
      .toBe(portfolioProjects.length);
    await expectTitlesAcrossAdminPages(
      page,
      portfolioProjects.map((project) => projectListTitle(project)),
    );
  });
});
