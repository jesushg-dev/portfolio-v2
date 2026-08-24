import type { Page, Response } from "@playwright/test";

import {
  portfolioCertifications,
  type PortfolioCertificationFixture,
} from "../fixtures/portfolio-certifications";
import { portfolioSkills } from "../fixtures/portfolio-skills";
import { matchCertificationSkillKeys } from "../../prisma/lib/match-certification-skills";
import {
  ensureAdminOrigin,
  gotoAdminPath,
  isAdminCollectionListUrl,
  waitForAdminListAfterSave,
} from "./admin-origin";
import { openAdminPagedList } from "./admin-paged-list";
import { selectSkillsInPicker } from "./skill-picker-actions";

const CERT_LOCALES = ["es", "en", "nl"] as const;

const skillsByKey = Object.fromEntries(
  portfolioSkills.map((skill) => [skill.key, skill]),
);

interface FillCertificationFormOptions {
  verifyInList?: boolean;
}

function resolveCertificationSkillKeys(
  certification: PortfolioCertificationFixture,
): string[] {
  if (certification.skillKeys.length > 0) {
    return certification.skillKeys;
  }

  return matchCertificationSkillKeys(certification, portfolioSkills);
}

function isValidUrl(value: string): boolean {
  if (!value.trim()) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function certificationListTitle(
  certification: PortfolioCertificationFixture,
): string {
  const english = certification.translations.find(
    (translation) => translation.locale === "en",
  );
  return (
    english?.title ?? certification.translations[0]?.title ?? certification.key
  );
}

async function assertCreateCertificationSucceeded(
  response: Response,
): Promise<void> {
  const text = await response.text().catch(() => "");
  if (!response.ok()) {
    throw new Error(
      `createCertification request failed: ${response.status()} ${text}`.trim(),
    );
  }

  if (!text.trim()) return;

  try {
    const payload = JSON.parse(text) as [
      { error?: { json?: { message?: string } } },
    ];
    const message = payload[0]?.error?.json?.message;
    if (message) {
      throw new Error(`createCertification mutation failed: ${message}`);
    }
  } catch (error) {
    if (error instanceof SyntaxError) return;
    throw error;
  }
}

export async function goToCertificationsList(page: Page): Promise<void> {
  // Locale title fields for inactive tabs stay `hidden`; lang buttons are always visible.
  const formOpen = await page.locator("#certification-lang-es").isVisible();
  if (
    isAdminCollectionListUrl(page, "certifications") &&
    !formOpen &&
    (await page.locator("#certifications-add").isVisible())
  ) {
    return;
  }

  await gotoAdminPath(page, "/admin/certifications");
  await page
    .locator("#certifications-add")
    .waitFor({ state: "visible", timeout: 15_000 });
}

async function openNewCertificationForm(page: Page): Promise<void> {
  await goToCertificationsList(page);

  const addButton = page.locator("#certifications-add");
  await addButton.scrollIntoViewIfNeeded();
  await addButton.waitFor({ state: "visible", timeout: 15_000 });
  await addButton.click();

  await page.waitForURL(/\/admin\/certifications\/new\/?$/, {
    timeout: 20_000,
  });
  // Primary locale is `en`; ES title input exists but stays hidden until its tab is active.
  await page.locator("#certification-lang-es").waitFor({
    state: "visible",
    timeout: 20_000,
  });
}

async function waitForCertificationSaveToFinish(page: Page): Promise<void> {
  await waitForAdminListAfterSave(page, "certifications", "certifications-add");
}

async function selectCertificationType(
  page: Page,
  type: string,
): Promise<void> {
  const checkbox = page.getByRole("checkbox", { name: type, exact: true });
  const isChecked = await checkbox.getAttribute("aria-checked");
  if (isChecked !== "true") {
    await checkbox.click();
  }
}

export async function fillCertificationForm(
  page: Page,
  certification: PortfolioCertificationFixture,
  options: FillCertificationFormOptions = {},
): Promise<void> {
  const { verifyInList = true } = options;

  await openNewCertificationForm(page);

  for (const locale of CERT_LOCALES) {
    const translation = certification.translations.find(
      (row) => row.locale === locale,
    );
    if (!translation) continue;

    await page.locator(`#certification-lang-${locale}`).click();
    await page
      .locator(`#certification-title-${locale}`)
      .fill(translation.title);
  }

  await page
    .locator("#certification-issuing-company")
    .fill(certification.company);

  if (isValidUrl(certification.url)) {
    await page.locator("#certification-credential-url").fill(certification.url);
  }

  if (certification.idCredential.trim()) {
    await page
      .locator("#certification-credential-id")
      .fill(certification.idCredential);
  }

  if (certification.image.trim()) {
    await page.locator("#certification-image").fill(certification.image);
  }

  await selectCertificationType(page, certification.type);
  await selectSkillsInPicker(
    page,
    resolveCertificationSkillKeys(certification),
    skillsByKey,
  );

  const [createResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/trpc/certificationsAdmin.createItem") &&
        response.request().method() === "POST",
      { timeout: 30_000 },
    ),
    page.locator('form button[type="submit"]').first().click(),
  ]);

  await assertCreateCertificationSucceeded(createResponse);

  if (verifyInList) {
    await expectCertificationListContains(
      page,
      certificationListTitle(certification),
    );
  } else {
    await waitForCertificationSaveToFinish(page);
  }
}

function certificationListRow(page: Page, title: string) {
  return page
    .locator("table tbody tr")
    .filter({ has: page.getByText(title, { exact: true }) })
    .first();
}

export async function expectCertificationListContains(
  page: Page,
  title: string,
): Promise<void> {
  await waitForCertificationSaveToFinish(page);

  const row = certificationListRow(page, title);
  if ((await row.count()) > 0) {
    return;
  }

  await openAdminPagedList(page, "/admin/certifications", "certifications-add");
  await row.waitFor({ timeout: 15_000 });
}

export async function cleanupUserCertifications(page: Page): Promise<void> {
  await ensureAdminOrigin(page);
  const deleteResponse = await page.request.post(
    `/api/trpc/certificationsAdmin.deleteAll?batch=1`,
    {
      data: {
        "0": { json: null },
      },
    },
  );

  if (!deleteResponse.ok()) {
    throw new Error(
      `Failed to cleanup cleanupUserCertifications: ${deleteResponse.status()} ${await deleteResponse.text()}`,
    );
  }
}

export { portfolioCertifications };
