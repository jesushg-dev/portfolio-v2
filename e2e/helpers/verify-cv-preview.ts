import { expect, type Locator, type Page } from "@playwright/test";

import {
  portfolioCv,
  type LocalizedFixture,
  type PortfolioCvEducationFixture,
  type PortfolioCvExperienceFixture,
} from "../fixtures/portfolio-cv";
import { portfolioProfile } from "../fixtures/portfolio-profile";
import { formatExperienceDates } from "../../src/utils/tools/date";

export type CvPreviewLocale = "es" | "en" | "nl";

export type CvPreviewRootId = "cv-admin-preview" | "cv-public-preview";

function localizedText(
  text: LocalizedFixture,
  locale: CvPreviewLocale,
): string {
  return text[locale];
}

/** Matches `education.tsx` — institution and location share one line. */
function educationInstitutionLine(
  education: PortfolioCvEducationFixture,
  locale: CvPreviewLocale,
): string {
  const location = education.location
    ? localizedText(education.location, locale)
    : "";
  return location
    ? `${education.institution} | ${location}`
    : education.institution;
}

/** Matches `experiences.tsx` — company and dates share one line. */
function experienceCompanyLine(
  experience: PortfolioCvExperienceFixture,
  locale: CvPreviewLocale,
): string {
  const dates = formatExperienceDates(
    experience.startDate ? new Date(experience.startDate) : null,
    experience.endDate ? new Date(experience.endDate) : null,
    experience.current,
    locale,
  );
  return dates ? `${experience.company} · ${dates}` : experience.company;
}

/** Matches list items in `soft-skills.tsx` / `additional-information.tsx`. */
function localizedListItem(
  text: LocalizedFixture,
  locale: CvPreviewLocale,
): string {
  return `${localizedText(text, locale)}.`;
}

export function cvPreviewRoot(page: Page, rootId: CvPreviewRootId): Locator {
  return page.locator(`#${rootId}`);
}

export async function openAdminCvPreview(
  page: Page,
  locale?: CvPreviewLocale,
): Promise<void> {
  const sectionModal = page.locator("#cv-section-modal");
  if (await sectionModal.isVisible()) {
    await page.locator("#cv-section-modal-close").click();
    await sectionModal.waitFor({ state: "hidden", timeout: 15_000 });
  }

  await page.locator("#cv-editor-preview").click();
  await page
    .locator("#cv-admin-preview")
    .waitFor({ state: "visible", timeout: 30_000 });

  if (locale) {
    await switchAdminPreviewLocale(page, locale);
  }
}

export async function switchAdminPreviewLocale(
  page: Page,
  locale: CvPreviewLocale,
): Promise<void> {
  await page.locator(`#cv-preview-locale-${locale}`).click();
}

export async function goToPublicCvPage(
  page: Page,
  locale: CvPreviewLocale = portfolioProfile.defaultLocale,
): Promise<void> {
  const path =
    locale === "en" ? "/curriculum-vitae" : `/${locale}/curriculum-vitae`;

  await page.goto(path);
  await page
    .locator("#cv-public-preview")
    .waitFor({ state: "visible", timeout: 30_000 });
}

export async function expectCvPreviewContent(
  page: Page,
  rootId: CvPreviewRootId,
  locale: CvPreviewLocale = portfolioProfile.defaultLocale,
): Promise<void> {
  const root = cvPreviewRoot(page, rootId);

  await expect(
    root.getByText(portfolioCv.header.fullName, { exact: true }),
  ).toBeVisible();
  await expect(
    root.getByRole("heading", {
      level: 1,
      name: localizedText(portfolioCv.header.degree, locale),
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    root.getByText(localizedText(portfolioCv.aboutMe, locale)),
  ).toBeVisible();

  for (const contact of portfolioCv.contacts) {
    await expect(
      root
        .getByText(localizedText(contact.label, locale), { exact: true })
        .first(),
    ).toBeVisible();
  }

  for (const education of portfolioCv.education) {
    await expect(
      root.getByText(localizedText(education.degreeName, locale), {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      root.getByText(educationInstitutionLine(education, locale), {
        exact: true,
      }),
    ).toBeVisible();
  }

  for (const language of portfolioCv.languages) {
    await expect(
      root.getByText(localizedText(language.name, locale), { exact: true }),
    ).toBeVisible();
    await expect(
      root.getByText(localizedText(language.level, locale), { exact: true }),
    ).toBeVisible();
  }

  for (const skill of portfolioCv.technicalSkills) {
    for (const item of skill.items) {
      await expect(root.getByText(item, { exact: true }).first()).toBeVisible();
    }
  }

  for (const experience of portfolioCv.experiences) {
    await expect(
      root
        .getByText(localizedText(experience.role, locale), { exact: true })
        .first(),
    ).toBeVisible();
    await expect(
      root
        .getByText(experienceCompanyLine(experience, locale), { exact: true })
        .first(),
    ).toBeVisible();
  }

  for (const softSkill of portfolioCv.softSkills) {
    await expect(
      root.getByText(localizedListItem(softSkill.name, locale), {
        exact: true,
      }),
    ).toBeVisible();
  }

  for (const additional of portfolioCv.additionalInformation) {
    await expect(
      root.getByText(localizedListItem(additional.text, locale), {
        exact: true,
      }),
    ).toBeVisible();
  }
}
