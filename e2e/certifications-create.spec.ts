import { expect, test } from "./authenticated-test";
import { getWorkerAuthFile } from "./helpers/auth-state";
import { ensurePortfolioSkills } from "./helpers/ensure-portfolio-skills";
import {
  certificationListTitle,
  cleanupUserCertifications,
  fillCertificationForm,
  goToCertificationsList,
  portfolioCertifications,
} from "./helpers/fill-certification-form";

test.setTimeout(60 * 60 * 1000);

test.describe.configure({ mode: "serial" });

test.describe("certifications create", () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: getWorkerAuthFile(),
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

    await goToCertificationsList(page);
    await page.goto("/admin/certifications?perPage=100");
    for (const certification of portfolioCertifications) {
      await expect(
        page
          .locator("table tbody tr")
          .filter({
            has: page.getByText(certificationListTitle(certification), {
              exact: false,
            }),
          })
          .first(),
      ).toBeVisible({ timeout: 30_000 });
    }
  });
});
