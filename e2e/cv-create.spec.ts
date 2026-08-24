import { expect, test } from "./authenticated-test";

import { ensurePortfolioSkills } from "./helpers/ensure-portfolio-skills";
import {
  cleanupUserCv,
  fillCvFromFixture,
  getCvMine,
  portfolioCv,
} from "./helpers/fill-cv-form";
import {
  expectCvPreviewContent,
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
    await expect
      .poll(
        async () => {
          const current = await getCvMine(page);
          return {
            contacts: current.contacts.length,
            educations: current.educations.length,
            languages: current.languages.length,
            technicalSkills: current.technicalSkills.length,
            experiences: current.experiences.length,
            softSkills: current.softSkills.length,
            additionalInformation: current.additionalInformation.length,
          };
        },
        { timeout: 60_000 },
      )
      .toEqual({
        contacts: portfolioCv.contacts.length,
        educations: portfolioCv.education.length,
        languages: portfolioCv.languages.length,
        technicalSkills: portfolioCv.technicalSkills.length,
        experiences: portfolioCv.experiences.length,
        softSkills: portfolioCv.softSkills.length,
        additionalInformation: portfolioCv.additionalInformation.length,
      });

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

    await openAdminCvPreview(page, previewLocale);
    await expectCvPreviewContent(page, "cv-admin-preview", previewLocale);
  });
});
