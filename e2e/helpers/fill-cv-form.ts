import type { Page } from "@playwright/test";

import {
  portfolioCv,
  type LocalizedFixture,
  type PortfolioCvContactFixture,
  type PortfolioCvEducationFixture,
  type PortfolioCvExperienceFixture,
  type PortfolioCvFixture,
  type PortfolioCvLanguageFixture,
  type PortfolioCvSoftSkillFixture,
  type PortfolioCvTechnicalSkillFixture,
} from "../fixtures/portfolio-cv";
import { portfolioProfile } from "../fixtures/portfolio-profile";
import {
  portfolioSkills,
  type PortfolioSkillFixture,
} from "../fixtures/portfolio-skills";
import { selectSkillsInPicker } from "./skill-picker-actions";
import { clickSelectOption } from "./select-option";

const CV_LOCALES = ["es", "en", "nl"] as const;

const skillsByKey = Object.fromEntries(
  portfolioSkills.map((skill) => [skill.key, skill]),
) as Record<string, PortfolioSkillFixture>;

interface CvMine {
  header: { fullName: string } | null;
  contacts: { id: string; value: string }[];
  educations: { id: string; institution: string }[];
  languages: { id: string }[];
  technicalSkills: { id: string; category: string }[];
  experiences: { id: string; company: string }[];
  softSkills: { id: string }[];
  additionalInformation: { id: string }[];
}

function trpcGetInput(procedure: string, input: unknown = {}): string {
  return `/api/trpc/${procedure}?batch=1&input=${encodeURIComponent(
    JSON.stringify({ "0": { json: input } }),
  )}`;
}

async function trpcQuery<T>(page: Page, procedure: string): Promise<T> {
  const response = await page.request.get(trpcGetInput(procedure));
  if (!response.ok()) {
    throw new Error(
      `tRPC query ${procedure} failed: ${response.status()} ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as [
    { result?: { data?: { json?: T } } },
  ];
  return payload[0]?.result?.data?.json as T;
}

async function trpcMutate(
  page: Page,
  procedure: string,
  input: unknown,
): Promise<void> {
  const response = await page.request.post(`/api/trpc/${procedure}?batch=1`, {
    headers: { "content-type": "application/json" },
    data: { "0": { json: input } },
  });

  if (!response.ok()) {
    throw new Error(
      `tRPC mutation ${procedure} failed: ${response.status()} ${await response.text()}`,
    );
  }
}

export async function goToCvEditor(page: Page): Promise<void> {
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/trpc/cv.getMine") &&
        response.request().method() === "GET" &&
        response.ok(),
      { timeout: 30_000 },
    ),
    page.goto("/admin/cv"),
  ]);
  await page.locator("#header").waitFor({ state: "visible", timeout: 20_000 });
}

export async function openCvSection(
  page: Page,
  sectionId: string,
): Promise<void> {
  await closeCvSectionModal(page);

  const section = page.locator(`#${sectionId}`);
  await section.scrollIntoViewIfNeeded();

  const empty = page.locator(`#cv-section-${sectionId}-empty`);
  if (await empty.isVisible()) {
    await empty.click();
  } else {
    await page.locator(`#cv-section-${sectionId}-edit`).click({ force: true });
  }

  await page.locator("#cv-section-modal").waitFor({ state: "visible" });
}

async function closeCvSectionModal(page: Page): Promise<void> {
  const modal = page.locator("#cv-section-modal");
  if (!(await modal.isVisible())) return;
  await page.locator("#cv-section-modal-close").click();
  await modal.waitFor({ state: "hidden", timeout: 15_000 });
}

async function activeCvModal(page: Page) {
  const itemModal = page.locator("#cv-item-modal");
  if (await itemModal.isVisible()) {
    return itemModal;
  }
  return page.locator("#cv-section-modal");
}

async function switchCvLocale(
  page: Page,
  locale: (typeof CV_LOCALES)[number],
  langSelectorPrefix: string,
): Promise<void> {
  const modal = await activeCvModal(page);
  await modal.locator(`#${langSelectorPrefix}-lang-${locale}`).click();
}

async function fillLocalizedField(
  page: Page,
  inputIdPrefix: string,
  langSelectorPrefix: string,
  text: LocalizedFixture,
): Promise<void> {
  const modal = await activeCvModal(page);
  for (const locale of CV_LOCALES) {
    await switchCvLocale(page, locale, langSelectorPrefix);
    const field = modal.locator(`#${inputIdPrefix}-${locale}`);
    await field.waitFor({ state: "visible", timeout: 15_000 });
    await field.fill(text[locale]);
  }
}

async function submitCvForm(
  page: Page,
  formId: string,
  mutation: string,
): Promise<void> {
  const modal = await activeCvModal(page);
  const submitId = `${formId}-submit`;

  const responsePromise = page.waitForResponse(
    (response) => {
      if (response.request().method() !== "POST") return false;
      if (!response.url().includes("/api/trpc")) return false;
      if (response.url().includes(`cv.${mutation}`)) return response.ok();
      const body = response.request().postData() ?? "";
      return body.includes(mutation) && response.ok();
    },
    { timeout: 30_000 },
  );

  await modal.locator(`#${submitId}`).click();

  await responsePromise;
}

async function openCvItemModal(page: Page, addButtonId: string): Promise<void> {
  await page.locator(`#${addButtonId}`).click();
  await page.locator("#cv-item-modal").waitFor({ state: "visible" });
}

async function waitForCvItemModalClosed(page: Page): Promise<void> {
  await page.locator("#cv-item-modal").waitFor({ state: "hidden" });
}

export function contactListLabel(contact: PortfolioCvContactFixture): string {
  return contact.label.en || contact.value;
}

export async function fillCvHeader(
  page: Page,
  cv: PortfolioCvFixture,
): Promise<void> {
  await openCvSection(page, "header");
  await page
    .locator("#cv-section-modal #cv-header-full-name")
    .waitFor({ state: "visible", timeout: 20_000 });
  await page.locator("#cv-header-full-name").fill(cv.header.fullName);
  await page.locator("#cv-header-photo-url").fill(portfolioProfile.photoUrl);
  await fillLocalizedField(
    page,
    "cv-header-degree",
    "cv-header",
    cv.header.degree,
  );
  await fillLocalizedField(
    page,
    "cv-header-photo-alt",
    "cv-header",
    cv.header.clientImageAlt,
  );
  await submitCvForm(page, "cv-header-form", "upsertHeader");
  await closeCvSectionModal(page);
}

export async function fillCvAbout(
  page: Page,
  cv: PortfolioCvFixture,
): Promise<void> {
  await openCvSection(page, "about");
  await page
    .locator("#cv-section-modal #cv-about-lang-en")
    .waitFor({ state: "visible", timeout: 20_000 });
  await fillLocalizedField(page, "cv-about-me", "cv-about", cv.aboutMe);
  await submitCvForm(page, "cv-about-form", "upsertAboutMe");
  await closeCvSectionModal(page);
}

export async function fillCvContact(
  page: Page,
  contact: PortfolioCvContactFixture,
): Promise<void> {
  await openCvItemModal(page, "cv-contacts-add");
  await clickSelectOption(
    page,
    "cv-contact-type",
    `cv-contact-type-option-${contact.type}`,
  );
  await page.locator("#cv-contact-value").fill(contact.value);
  await fillLocalizedField(
    page,
    "cv-contact-label",
    "cv-contact",
    contact.label,
  );
  await submitCvForm(page, "cv-contact-form", "createContact");
  await waitForCvItemModalClosed(page);
}

export async function fillCvEducation(
  page: Page,
  education: PortfolioCvEducationFixture,
): Promise<void> {
  await openCvItemModal(page, "cv-education-add");
  await page.locator("#education-institution").fill(education.institution);
  await fillLocalizedField(
    page,
    "education-degree",
    "cv-education",
    education.degreeName,
  );
  if (education.location) {
    await fillLocalizedField(
      page,
      "education-location",
      "cv-education",
      education.location,
    );
  }
  if (education.dates) {
    await page.locator("#education-dates").fill(education.dates);
  }
  await submitCvForm(page, "cv-education-form", "createEducation");
  await waitForCvItemModalClosed(page);
}

export async function fillCvLanguage(
  page: Page,
  language: PortfolioCvLanguageFixture,
): Promise<void> {
  await openCvItemModal(page, "cv-languages-add");
  await fillLocalizedField(
    page,
    "cv-language-name",
    "cv-language",
    language.name,
  );
  await fillLocalizedField(
    page,
    "cv-language-level",
    "cv-language",
    language.level,
  );
  await submitCvForm(page, "cv-language-form", "createLanguage");
  await waitForCvItemModalClosed(page);
}

export async function fillCvTechnicalSkill(
  page: Page,
  skill: PortfolioCvTechnicalSkillFixture,
): Promise<void> {
  await openCvItemModal(page, "cv-skills-add");
  await clickSelectOption(
    page,
    "cv-skill-category",
    `cv-skill-category-option-${skill.category}`,
  );
  await page.locator("#cv-skill-items").fill(skill.items.join(", "));
  await submitCvForm(page, "cv-skill-form", "createTechnicalSkill");
  await waitForCvItemModalClosed(page);
}

export async function fillCvExperience(
  page: Page,
  experience: PortfolioCvExperienceFixture,
): Promise<void> {
  await openCvItemModal(page, "cv-experience-add");
  await page.locator("#experience-company").fill(experience.company);
  // Format date as YYYY-MM for type="month" input
  const formatMonth = (d: string | Date) =>
    new Date(d).toISOString().slice(0, 7);

  await page
    .locator("#experience-start-date")
    .fill(formatMonth(experience.startDate));
  if (experience.current) {
    await page.locator("#experience-current").check();
  } else if (experience.endDate) {
    await page.locator("#experience-current").uncheck();
    await page
      .locator("#experience-end-date")
      .fill(formatMonth(experience.endDate));
  }
  await fillLocalizedField(
    page,
    "experience-role",
    "cv-experience",
    experience.role,
  );

  for (let index = 0; index < experience.responsibilities.length; index += 1) {
    await page.locator("#experience-add-responsibility").click();
    await fillLocalizedField(
      page,
      `experience-responsibility-${index}`,
      "cv-experience",
      experience.responsibilities[index].text,
    );
  }

  if (experience.skillKeys.length > 0) {
    await selectSkillsInPicker(page, experience.skillKeys, skillsByKey);
  }

  await submitCvForm(page, "cv-experience-form", "createExperience");
  await waitForCvItemModalClosed(page);
}

export async function fillCvSoftSkill(
  page: Page,
  softSkill: PortfolioCvSoftSkillFixture,
): Promise<void> {
  await openCvItemModal(page, "cv-soft-skills-add");
  await fillLocalizedField(
    page,
    "cv-soft-skill-text",
    "cv-soft-skill",
    softSkill.name,
  );
  await submitCvForm(page, "cv-soft-skill-form", "createSoftSkill");
  await waitForCvItemModalClosed(page);
}

export async function fillCvAdditionalInfo(
  page: Page,
  item: PortfolioCvFixture["additionalInformation"][number],
): Promise<void> {
  await openCvItemModal(page, "cv-additional-add");
  await fillLocalizedField(
    page,
    "cv-additional-text",
    "cv-additional",
    item.text,
  );
  await submitCvForm(page, "cv-additional-form", "createAdditionalInfo");
  await waitForCvItemModalClosed(page);
  await page
    .locator("#cv-section-modal")
    .getByText(item.text.es, { exact: true })
    .waitFor({ state: "visible", timeout: 15_000 });
}

export async function fillCvFromFixture(page: Page): Promise<void> {
  await goToCvEditor(page);

  await fillCvHeader(page, portfolioCv);
  await fillCvAbout(page, portfolioCv);

  await openCvSection(page, "contacts");
  for (const contact of portfolioCv.contacts) {
    await fillCvContact(page, contact);
  }

  await openCvSection(page, "education");
  for (const education of portfolioCv.education) {
    await fillCvEducation(page, education);
  }

  await openCvSection(page, "languages");
  for (const language of portfolioCv.languages) {
    await fillCvLanguage(page, language);
  }

  await openCvSection(page, "skills");
  for (const skill of portfolioCv.technicalSkills) {
    await fillCvTechnicalSkill(page, skill);
  }

  await openCvSection(page, "experience");
  for (const experience of portfolioCv.experiences) {
    await fillCvExperience(page, experience);
  }

  await openCvSection(page, "soft-skills");
  for (const softSkill of portfolioCv.softSkills) {
    await fillCvSoftSkill(page, softSkill);
  }

  await openCvSection(page, "additional");
  for (const item of portfolioCv.additionalInformation) {
    await fillCvAdditionalInfo(page, item);
  }

  await closeCvSectionModal(page);
}

export async function cleanupUserCv(page: Page): Promise<void> {
  const cv = await trpcQuery<CvMine>(page, "cv.getMine");

  for (const experience of cv.experiences) {
    await trpcMutate(page, "cv.deleteExperience", { id: experience.id });
  }
  for (const contact of cv.contacts) {
    await trpcMutate(page, "cv.deleteContact", { id: contact.id });
  }
  for (const education of cv.educations) {
    await trpcMutate(page, "cv.deleteEducation", { id: education.id });
  }
  for (const language of cv.languages) {
    await trpcMutate(page, "cv.deleteLanguage", { id: language.id });
  }
  for (const skill of cv.technicalSkills) {
    await trpcMutate(page, "cv.deleteTechnicalSkill", { id: skill.id });
  }
  for (const softSkill of cv.softSkills) {
    await trpcMutate(page, "cv.deleteSoftSkill", { id: softSkill.id });
  }
  for (const item of cv.additionalInformation) {
    await trpcMutate(page, "cv.deleteAdditionalInfo", { id: item.id });
  }
}

export async function getCvMine(page: Page): Promise<CvMine> {
  return trpcQuery<CvMine>(page, "cv.getMine");
}

export { portfolioCv };
