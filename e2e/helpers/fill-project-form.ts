import type { Page, Response } from "@playwright/test";

import {
  portfolioProjects,
  type PortfolioProjectFixture,
} from "../fixtures/portfolio-projects";
import {
  portfolioSkills,
  type PortfolioSkillFixture,
} from "../fixtures/portfolio-skills";

const PROJECT_LOCALES = ["es", "en", "nl"] as const;

const skillsByKey = Object.fromEntries(
  portfolioSkills.map((skill) => [skill.key, skill]),
) as Record<string, PortfolioSkillFixture>;

type FillProjectFormOptions = {
  /** Skip list navigation after each create (use for bulk runs). */
  verifyInList?: boolean;
};

function toSkillSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
  if (!response.ok()) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `createProject request failed: ${response.status()} ${text}`.trim(),
    );
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
  if (/\/admin\/projects(\?|$)/.test(page.url())) {
    return;
  }

  const navLink = projectsNavLink(page);
  await navLink.waitFor({ state: "visible", timeout: 15_000 });
  await navLink.click();
  await page.waitForURL(/\/admin\/projects(\?|$)/, { timeout: 15_000 });
}

async function openNewProjectForm(page: Page): Promise<void> {
  await goToProjectsList(page);
  await page.locator("#projects-add").click();
  await page.waitForURL(/\/admin\/projects\/new\/?$/, { timeout: 15_000 });
}

async function waitForProjectSaveToFinish(page: Page): Promise<void> {
  await page.waitForURL((url) => !url.pathname.endsWith("/new"), {
    timeout: 30_000,
  });

  if (!/\/admin\/projects(\?|$)/.test(page.url())) {
    await goToProjectsList(page);
  }

  await page
    .locator("#projects-add")
    .waitFor({ state: "visible", timeout: 15_000 });
}

async function selectProjectSkills(
  page: Page,
  skillKeys: string[],
): Promise<void> {
  await page.locator("#skill-picker-search").waitFor({ state: "visible" });

  for (const skillKey of skillKeys) {
    const skill = skillsByKey[skillKey];
    if (!skill) {
      throw new Error(`Unknown skill key "${skillKey}" in project fixture`);
    }

    await page.locator("#skill-picker-search").fill(skill.title);
    const pickerButton = page.locator(
      `#skill-picker-${toSkillSlug(skill.title)}`,
    );
    await pickerButton.waitFor({ state: "visible", timeout: 10_000 });
    await pickerButton.click();
    await page.locator("#skill-picker-search").fill("");
  }
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
      response.url().includes("/api/trpc/portfolioAdmin.createProject") &&
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

export async function expectProjectListContains(
  page: Page,
  title: string,
): Promise<void> {
  await goToProjectsList(page);

  if (!page.url().includes("perPage=")) {
    await page.goto(`${page.url().split("?")[0]}?perPage=100`, {
      waitUntil: "domcontentloaded",
    });
  }

  await page
    .locator("table tbody tr")
    .filter({ has: page.getByText(title, { exact: true }) })
    .first()
    .waitFor({ timeout: 15_000 });
}

export async function cleanupUserProjects(page: Page): Promise<void> {
  const fixtureTitles = new Set(
    portfolioProjects.map((project) => projectListTitle(project)),
  );

  const listResponse = await page.request.get(
    `/api/trpc/portfolioAdmin.getMyProjects?batch=1&input=${encodeURIComponent(
      JSON.stringify({ "0": { json: null } }),
    )}`,
  );

  if (!listResponse.ok()) {
    throw new Error(
      `Failed to list projects for cleanup: ${listResponse.status()} ${await listResponse.text()}`,
    );
  }

  const listPayload = (await listResponse.json()) as [
    {
      result?: {
        data?: {
          json?: {
            id: string;
            ProjectTranslation?: { title: string }[];
          }[];
        };
      };
    },
  ];

  const projects = listPayload[0]?.result?.data?.json ?? [];
  const deletable = projects.filter((project) => {
    const titles =
      project.ProjectTranslation?.map((translation) => translation.title) ?? [];
    return titles.some((title) => fixtureTitles.has(title));
  });

  for (const project of deletable) {
    const deleteResponse = await page.request.post(
      "/api/trpc/portfolioAdmin.deleteProject?batch=1",
      {
        headers: { "content-type": "application/json" },
        data: { "0": { json: { id: project.id } } },
      },
    );

    if (!deleteResponse.ok()) {
      throw new Error(
        `Failed to delete project ${project.id}: ${deleteResponse.status()} ${await deleteResponse.text()}`,
      );
    }
  }
}

export { portfolioProjects };
