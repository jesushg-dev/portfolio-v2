import type { Page, Response } from "@playwright/test";

import {
  portfolioProjects,
  type PortfolioProjectFixture,
} from "../fixtures/portfolio-projects";
import {
  portfolioSkills,
  type PortfolioSkillFixture,
} from "../fixtures/portfolio-skills";
import { selectSkillsInPicker } from "./skill-picker-actions";

const PROJECT_LOCALES = ["es", "en", "nl"] as const;

const skillsByKey = Object.fromEntries(
  portfolioSkills.map((skill) => [skill.key, skill]),
) as Record<string, PortfolioSkillFixture>;

interface FillProjectFormOptions {
  /** Skip list navigation after each create (use for bulk runs). */
  verifyInList?: boolean;
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

export function projectListTitle(project: PortfolioProjectFixture): string {
  const english = project.translations.find(
    (translation) => translation.locale === "en",
  );
  return english?.title ?? project.translations[0]?.title ?? project.key;
}

async function assertCreateProjectSucceeded(response: Response): Promise<void> {
  const text = await response.text().catch(() => "");
  if (!response.ok()) {
    throw new Error(
      `createProject request failed: ${response.status()} ${text}`.trim(),
    );
  }

  if (!text.trim()) return;

  try {
    const payload = JSON.parse(text) as [
      { error?: { json?: { message?: string } } },
    ];
    const message = payload[0]?.error?.json?.message;
    if (message) {
      throw new Error(`createProject mutation failed: ${message}`);
    }
  } catch (error) {
    if (error instanceof SyntaxError) return;
    throw error;
  }
}

function projectsNavLink(page: Page) {
  return page
    .locator('a[href*="/admin/projects"]')
    .filter({ hasNot: page.locator('[href*="/new"], [href*="/edit"]') })
    .first();
}

/** Navigate to the projects list via the admin sidebar. */
export async function goToProjectsList(page: Page): Promise<void> {
  const addButton = page.locator("#projects-add");
  if (await addButton.isVisible()) {
    return;
  }

  const navLink = projectsNavLink(page);
  await navLink.waitFor({ state: "visible", timeout: 15_000 });
  await navLink.click();
  await page.waitForURL(/\/admin\/projects(\?|$)/, { timeout: 20_000 });
  await addButton.waitFor({ state: "visible", timeout: 15_000 });
}

async function openNewProjectForm(page: Page): Promise<void> {
  await goToProjectsList(page);

  const addButton = page.locator("#projects-add");
  await addButton.scrollIntoViewIfNeeded();
  await addButton.waitFor({ state: "visible", timeout: 15_000 });
  await addButton.click();

  await page.waitForURL(/\/admin\/projects\/new\/?$/, { timeout: 20_000 });
}

async function waitForProjectSaveToFinish(page: Page): Promise<void> {
  await page.waitForURL((url) => !url.pathname.endsWith("/new"), {
    timeout: 30_000,
  });

  const addButton = page.locator("#projects-add");
  if (!(await addButton.isVisible())) {
    await goToProjectsList(page);
  }

  await addButton.waitFor({ state: "visible", timeout: 15_000 });
}

async function selectProjectSkills(
  page: Page,
  skillKeys: string[],
): Promise<void> {
  await selectSkillsInPicker(page, skillKeys, skillsByKey);
}

export async function fillProjectForm(
  page: Page,
  project: PortfolioProjectFixture,
  options: FillProjectFormOptions = {},
): Promise<void> {
  const { verifyInList = true } = options;

  await openNewProjectForm(page);

  for (const locale of PROJECT_LOCALES) {
    const translation = project.translations.find(
      (row) => row.locale === locale,
    );
    if (!translation) continue;

    await page.locator(`#project-lang-${locale}`).click();

    await page.locator(`#project-title-${locale}`).fill(translation.title);

    if (translation.description) {
      await page
        .locator(`#project-description-${locale}`)
        .fill(translation.description);
    }
  }

  await page.locator("#project-image").fill(project.image);

  await page.locator("#project-type").click();
  await page.getByRole("option", { name: project.type, exact: true }).click();

  if (project.isPrivate) {
    const privacySwitch = page.getByRole("switch");
    const isChecked = await privacySwitch.getAttribute("aria-checked");
    if (isChecked !== "true") {
      await privacySwitch.click();
    }
  }

  if (isValidUrl(project.githubUrl)) {
    await page.locator("#project-github-url").fill(project.githubUrl);
  }

  if (isValidUrl(project.websiteUrl)) {
    await page.locator("#project-live-demo-url").fill(project.websiteUrl);
  }

  if (project.skillKeys.length > 0) {
    await selectProjectSkills(page, project.skillKeys);
  }

  const createResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/trpc/projectsAdmin.createItem") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );

  await page.getByRole("button", { name: /create|crear|aanmaken/i }).click();

  await assertCreateProjectSucceeded(await createResponse);

  if (verifyInList) {
    await expectProjectListContains(page, projectListTitle(project));
  } else {
    await waitForProjectSaveToFinish(page);
  }
}

function projectListRow(page: Page, title: string) {
  return page
    .locator("table tbody tr")
    .filter({ has: page.getByText(title, { exact: true }) })
    .first();
}

async function ensureProjectsListPerPage(
  page: Page,
  perPage: number,
): Promise<void> {
  if (page.url().includes(`perPage=${perPage}`)) return;

  const listUrl = `/admin/projects?perPage=${perPage}`;
  try {
    await page.goto(listUrl, { waitUntil: "domcontentloaded" });
  } catch {
    await page.waitForURL(/\/admin\/projects/, { timeout: 15_000 });
  }
}

export async function expectProjectListContains(
  page: Page,
  title: string,
): Promise<void> {
  await waitForProjectSaveToFinish(page);

  const row = projectListRow(page, title);
  if ((await row.count()) > 0) {
    return;
  }

  await ensureProjectsListPerPage(page, 100);
  await row.waitFor({ timeout: 15_000 });
}

export async function cleanupUserProjects(page: Page): Promise<void> {
  const deleteResponse = await page.request.post(
    `/api/trpc/projectsAdmin.deleteAll?batch=1`,
    {
      data: {
        "0": { json: null },
      },
    },
  );

  if (!deleteResponse.ok()) {
    throw new Error(
      `Failed to cleanup cleanupUserProjects: ${deleteResponse.status()} ${await deleteResponse.text()}`,
    );
  }
}

export { portfolioProjects };
