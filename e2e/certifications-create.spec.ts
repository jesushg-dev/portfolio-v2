import { expect, test } from "./authenticated-test";
import { getWorkerAuthFile } from "./helpers/auth-state";
import {
  expectTitlesAcrossAdminPages,
  openAdminPagedList,
} from "./helpers/admin-paged-list";
import { ensurePortfolioSkills } from "./helpers/ensure-portfolio-skills";
import {
  certificationListTitle,
  cleanupUserCertifications,
  fillCertificationForm,
  goToCertificationsList,
  portfolioCertifications,
} from "./helpers/fill-certification-form";
import { fetchAdminTotalCount } from "./helpers/pagination";

test.setTimeout(60 * 60 * 1000);

test.describe.configure({ mode: "serial" });

test.describe("certifications create", () => {
  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      storageState: getWorkerAuthFile(testInfo.workerIndex),
    });
    const page = await context.newPage();
    await cleanupUserCertifications(page);
    await ensurePortfolioSkills(page);
    await context.close();
  });

  test("creates all portfolio certifications from the shared fixture", async ({
    page,
  }) => {
    await page.goto("/admin");
    await goToCertificationsList(page);

    for (const certification of portfolioCertifications) {
      await fillCertificationForm(page, certification, { verifyInList: false });
    }

    await openAdminPagedList(
      page,
      "/admin/certifications",
      "certifications-add",
    );
    await expect
      .poll(
        () => fetchAdminTotalCount(page, "certificationsAdmin.getMine"),
        { timeout: 30_000 },
      )
      .toBe(portfolioCertifications.length);
    await expectTitlesAcrossAdminPages(
      page,
      portfolioCertifications.map((certification) =>
        certificationListTitle(certification),
      ),
    );
  });
});
