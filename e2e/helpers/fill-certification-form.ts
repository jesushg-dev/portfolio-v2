import type { Page, Response } from "@playwright/test";

import {
  portfolioCertifications,
  type PortfolioCertificationFixture,
} from "../fixtures/portfolio-certifications";
import { portfolioSkills } from "../fixtures/portfolio-skills";
import { matchCertificationSkillKeys } from "../../prisma/lib/match-certification-skills";
import { selectSkillsInPicker } from "./skill-picker-actions";

const CERT_LOCALES = ["es", "en", "nl"] as const;

const skillsByKey = Object.fromEntries(
  portfolioSkills.map((skill) => [skill.key, skill]),
);

type FillCertificationFormOptions = {
  verifyInList?: boolean;
};

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

function certificationsNavLink(page: Page) {
  return page
    .locator('a[href*="/admin/certifications"]')
    .filter({ hasNot: page.locator('[href*="/new"], [href*="/edit"]') })
    .first();
}

export async function goToCertificationsList(page: Page): Promise<void> {
  const addButton = page.locator("#certifications-add");
  if (await addButton.isVisible()) {
    return;
  }

  const navLink = certificationsNavLink(page);
  await navLink.waitFor({ state: "visible", timeout: 15_000 });
  await navLink.click();
  await page.waitForURL(/\/admin\/certifications(\?|$)/, { timeout: 20_000 });
  await addButton.waitFor({ state: "visible", timeout: 15_000 });
}

async function waitForSkillsQuery(page: Page): Promise<void> {
  const skillsLoaded = await page.locator('[id^="skill-picker-"]').count();
  if (skillsLoaded > 0) return;

  await page.waitForResponse(
    (response) =>
      response.url().includes("/api/trpc/portfolioAdmin.getMySkills") &&
      response.request().method() === "GET" &&
      response.ok(),
    { timeout: 30_000 },
  );
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
  await waitForSkillsQuery(page);
}

async function waitForCertificationSaveToFinish(page: Page): Promise<void> {
  await page.waitForURL((url) => !url.pathname.endsWith("/new"), {
    timeout: 30_000,
  });

  const addButton = page.locator("#certifications-add");
  if (!(await addButton.isVisible())) {
    await goToCertificationsList(page);
  }

  await addButton.waitFor({ state: "visible", timeout: 15_000 });
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

  const createResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/trpc/portfolioAdmin.createCertification") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );

  await page.getByRole("button", { name: /create|crear|aanmaken/i }).click();

  await assertCreateCertificationSucceeded(await createResponse);

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

async function ensureCertificationsListPerPage(
  page: Page,
  perPage: number,
): Promise<void> {
  if (page.url().includes(`perPage=${perPage}`)) return;

  const listUrl = `/admin/certifications?perPage=${perPage}`;
  try {
    await page.goto(listUrl, { waitUntil: "domcontentloaded" });
  } catch {
    // Next.js client navigation can abort a redundant goto to the same route.
    await page.waitForURL(/\/admin\/certifications/, { timeout: 15_000 });
  }
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

  await ensureCertificationsListPerPage(page, 100);
  await row.waitFor({ timeout: 15_000 });
}

export async function cleanupUserCertifications(page: Page): Promise<void> {
  const listResponse = await page.request.get(
    `/api/trpc/portfolioAdmin.getMyCertifications?batch=1&input=${encodeURIComponent(
      JSON.stringify({ "0": { json: null } }),
    )}`,
  );

  if (!listResponse.ok()) {
    throw new Error(
      `Failed to list certifications for cleanup: ${listResponse.status()} ${await listResponse.text()}`,
    );
  }

  const listPayload = (await listResponse.json()) as [
    {
      result?: {
        data?: {
          json?: { id: string }[];
        };
      };
    },
  ];

  const certifications = listPayload[0]?.result?.data?.json ?? [];

  for (const certification of certifications) {
    const deleteResponse = await page.request.post(
      "/api/trpc/portfolioAdmin.deleteCertification?batch=1",
      {
        headers: { "content-type": "application/json" },
        data: { "0": { json: { id: certification.id } } },
      },
    );

    if (!deleteResponse.ok()) {
      throw new Error(
        `Failed to delete certification ${certification.id}: ${deleteResponse.status()} ${await deleteResponse.text()}`,
      );
    }
  }
}

export { portfolioCertifications };
