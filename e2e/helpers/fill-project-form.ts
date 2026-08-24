import type { Page, Response } from "@playwright/test";

import {
  portfolioProjects,
  type PortfolioProjectFixture,
} from "../fixtures/portfolio-projects";
import {
  portfolioSkills,
  type PortfolioSkillFixture,
} from "../fixtures/portfolio-skills";
import {
  ensureAdminOrigin,
  gotoAdminPath,
  isAdminCollectionListUrl,
  waitForAdminListAfterSave,
} from "./admin-origin";
import { openAdminPagedList } from "./admin-paged-list";
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

/** Navigate to the projects list via the admin sidebar. */
export async function goToProjectsList(page: Page): Promise<void> {
  // Locale title fields for inactive tabs stay `hidden`; lang buttons are always visible.
  const formOpen = await page.locator("#project-lang-es").isVisible();
  if (
    isAdminCollectionListUrl(page, "projects") &&
    !formOpen &&
    (await page.locator("#projects-add").isVisible())
  ) {
    return;
  }

  await gotoAdminPath(page, "/admin/projects");
  await page
    .locator("#projects-add")
    .waitFor({ state: "visible", timeout: 15_000 });
}

async function openNewProjectForm(page: Page): Promise<void> {
  await goToProjectsList(page);

  const addButton = page.locator("#projects-add");
  await addButton.scrollIntoViewIfNeeded();
  await addButton.waitFor({ state: "visible", timeout: 15_000 });
  await addButton.click();

  await page.waitForURL(/\/admin\/projects\/new\/?$/, { timeout: 20_000 });
  // Primary locale is `en`; `#project-title-es` exists but is hidden until its tab is active.
  await page.locator("#project-lang-es").waitFor({
    state: "visible",
    timeout: 20_000,
  });
}

async function enablePrivateProjectIfNeeded(page: Page): Promise<void> {
  const privacy = page.locator("#project-private");
  await privacy.waitFor({ state: "attached", timeout: 15_000 });
  await privacy.evaluate((element) => {
    const switchRoot =
      element.closest('[data-slot="switch"]') ??
      element.parentElement?.querySelector('[data-slot="switch"]') ??
      element;
    const input =
      switchRoot instanceof HTMLInputElement
        ? switchRoot
        : element instanceof HTMLInputElement
          ? element
          : null;
    if (input) {
      if (!input.checked) input.click();
      return;
    }
    const checked =
      switchRoot.getAttribute("aria-checked") === "true" ||
      switchRoot.hasAttribute("data-checked");
    if (!checked) {
      (switchRoot as HTMLElement).click();
    }
  });
}

async function waitForProjectSaveToFinish(page: Page): Promise<void> {
  await waitForAdminListAfterSave(page, "projects", "projects-add");
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
  await page
    .locator('[data-slot="select-content"]')
    .waitFor({ state: "hidden", timeout: 5_000 })
    .catch(() => {
      /* already closed */
    });

  if (project.isPrivate) {
    await enablePrivateProjectIfNeeded(page);
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

  const [createResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/trpc/projectsAdmin.createItem") &&
        response.request().method() === "POST",
      { timeout: 30_000 },
    ),
    page.locator('form button[type="submit"]').first().click(),
  ]);

  await assertCreateProjectSucceeded(createResponse);

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

export async function expectProjectListContains(
  page: Page,
  title: string,
): Promise<void> {
  await waitForProjectSaveToFinish(page);

  const row = projectListRow(page, title);
  if ((await row.count()) > 0) {
    return;
  }

  await openAdminPagedList(page, "/admin/projects", "projects-add");
  await row.waitFor({ timeout: 15_000 });
}

export async function cleanupUserProjects(page: Page): Promise<void> {
  await ensureAdminOrigin(page);
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
