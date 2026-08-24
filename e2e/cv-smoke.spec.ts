import { expect, test } from "./authenticated-test";

import { ensurePortfolioSkills } from "./helpers/ensure-portfolio-skills";
import {
  cleanupUserCv,
  fillCvContact,
  goToCvEditor,
  openCvSection,
  portfolioCv,
} from "./helpers/fill-cv-form";

test.describe("cv smoke", () => {
  test.setTimeout(120_000);

  test("creates one CV contact from the shared fixture", async ({ page }) => {
    await cleanupUserCv(page);
    await ensurePortfolioSkills(page);

    const contact = portfolioCv.contacts[0];
    if (!contact) {
      throw new Error("portfolio-cv fixture has no contacts");
    }

    await page.goto("/admin");
    await goToCvEditor(page);
    await openCvSection(page, "contacts");
    await fillCvContact(page, contact);

    await expect(
      page
        .locator("#cv-section-modal")
        .getByText(contact.value, { exact: true })
        .first(),
    ).toBeVisible();
  });
});
