import { expect, test } from "./authenticated-test";
import { getWorkerAuthFile } from "./helpers/auth-state";

import { ensurePortfolioSkills } from "./helpers/ensure-portfolio-skills";
import {
  certificationListTitle,
  cleanupUserCertifications,
  fillCertificationForm,
  portfolioCertifications,
} from "./helpers/fill-certification-form";

test.describe("certifications smoke", () => {
  test.setTimeout(90_000);

  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      storageState: getWorkerAuthFile(testInfo.workerIndex),
    });
    const page = await context.newPage();
    await cleanupUserCertifications(page);
    await ensurePortfolioSkills(page);
    await context.close();
  });

  test("creates one portfolio certification from the shared fixture", async ({
    page,
  }) => {
    await page.goto("/admin");

    const certification =
      portfolioCertifications.find((cert) => cert.skillKeys.length > 0) ??
      portfolioCertifications[0];
    if (!certification) {
      throw new Error("portfolio-certifications fixture is empty");
    }

    await fillCertificationForm(page, certification);
    await expect(
      page
        .locator("table tbody tr")
        .filter({
          has: page.getByText(certificationListTitle(certification), {
            exact: true,
          }),
        })
        .first(),
    ).toBeVisible();
  });
});
