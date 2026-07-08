import { test, expect } from "@playwright/test";

import { ensurePortfolioSkills } from "./helpers/ensure-portfolio-skills";
import {
  cleanupUserCv,
  fillCvFromFixture,
  getCvMine,
  portfolioCv,
} from "./helpers/fill-cv-form";
import {
  expectCvPreviewContent,
  goToPublicCvPage,
  openAdminCvPreview,
} from "./helpers/verify-cv-preview";
import { portfolioProfile } from "./fixtures/portfolio-profile";

test.setTimeout(60 * 60 * 1000);

test.describe.configure({ mode: "serial" });

test.describe("cv create", () => {
  test("creates the full portfolio CV from the shared fixture", async ({
    page,
  }) => {
    await cleanupUserCv(page);
    await ensurePortfolioSkills(page);
    await page.goto("/admin");
    await fillCvFromFixture(page);

    const cv = await getCvMine(page);

    expect(cv.header?.fullName).toBe(portfolioCv.header.fullName);
    expect(cv.contacts).toHaveLength(portfolioCv.contacts.length);
    expect(cv.educations).toHaveLength(portfolioCv.education.length);
    expect(cv.languages).toHaveLength(portfolioCv.languages.length);
    expect(cv.technicalSkills).toHaveLength(portfolioCv.technicalSkills.length);
    expect(cv.experiences).toHaveLength(portfolioCv.experiences.length);
    expect(cv.softSkills).toHaveLength(portfolioCv.softSkills.length);
    expect(cv.additionalInformation).toHaveLength(
      portfolioCv.additionalInformation.length,
    );

    for (const education of portfolioCv.education) {
      expect(
        cv.educations.some((row) => row.institution === education.institution),
      ).toBe(true);
    }

    for (const experience of portfolioCv.experiences) {
      expect(
        cv.experiences.some((row) => row.company === experience.company),
      ).toBe(true);
    }

    const previewLocale = portfolioProfile.defaultLocale;

    await openAdminCvPreview(page);
    await expectCvPreviewContent(page, "cv-admin-preview", previewLocale);

    await goToPublicCvPage(page, previewLocale);
    await expectCvPreviewContent(page, "cv-public-preview", previewLocale);
  });
});
