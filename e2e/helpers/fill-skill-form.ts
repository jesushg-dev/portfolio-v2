import type { Page, Response } from "@playwright/test";

import { clickSelectOption } from "./select-option";

import {
  portfolioSkills,
  type PortfolioSkillFixture,
} from "../fixtures/portfolio-skills";

const SKILL_LOCALES = ["es", "en", "nl"] as const;

type FillSkillFormOptions = {
  /** Skip list navigation after each create (use for bulk 42-skill runs). */
  verifyInList?: boolean;
};

async function assertCreateSkillSucceeded(response: Response): Promise<void> {
  if (!response.ok()) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `createSkill request failed: ${response.status()} ${text}`.trim(),
    );
  }
}

/** Sidebar link to the skills list (excludes /new and /edit routes). */
function skillsNavLink(page: Page) {
  return page
    .locator('a[href*="/admin/skills"]')
    .filter({ hasNot: page.locator('[href*="/new"], [href*="/edit"]') })
    .first();
}

/** Navigate to the skills list the way a user would — via the admin sidebar. */
export async function goToSkillsList(page: Page): Promise<void> {
  if (/\/admin\/skills(\?|$)/.test(page.url())) {
    return;
  }

  const navLink = skillsNavLink(page);
  await navLink.waitFor({ state: "visible", timeout: 15_000 });
  await navLink.click();
  await page.waitForURL(/\/admin\/skills(\?|$)/, { timeout: 15_000 });
}

/** Open the new-skill form via list → Add (no direct deep-link). */
async function openNewSkillForm(page: Page): Promise<void> {
  await goToSkillsList(page);
  await page.locator("#skills-add").click();
  await page.waitForURL(/\/admin\/skills\/new\/?$/, { timeout: 15_000 });
}

/** Wait until save finishes and we have left the form page. */
async function waitForSkillSaveToFinish(page: Page): Promise<void> {
  await page.waitForURL((url) => !url.pathname.endsWith("/new"), {
    timeout: 20_000,
  });

  // After router.back() we should be on the list; if not, reach it via sidebar.
  if (!/\/admin\/skills(\?|$)/.test(page.url())) {
    await goToSkillsList(page);
  }

  await page
    .locator("#skills-add")
    .waitFor({ state: "visible", timeout: 15_000 });
}

/** Switch the skill form to a locale and wait until its fields are visible. */
async function switchSkillLanguage(page: Page, locale: string): Promise<void> {
  const description = page.locator(`#skill-description-${locale}`);
  if (await description.isVisible()) return;

  const tab = page.locator(`#skill-lang-${locale}`);
  await tab.scrollIntoViewIfNeeded();
  await tab.click({ timeout: 10_000 });
  await description.waitFor({ state: "visible", timeout: 10_000 });
}

/** Pick a stack type from the select using stable option ids. */
async function selectSkillType(page: Page, type: string): Promise<void> {
  await clickSelectOption(page, "skill-type", `skill-type-option-${type}`);
}

export async function fillSkillForm(
  page: Page,
  skill: PortfolioSkillFixture,
  options: FillSkillFormOptions = {},
): Promise<void> {
  const { verifyInList = true } = options;

  await openNewSkillForm(page);

  await page.locator("#skill-title").waitFor({ state: "visible" });
  await page.locator("#skill-title").fill(skill.title);
  await page.locator("#skill-image").fill(skill.image);

  for (const locale of SKILL_LOCALES) {
    const translation = skill.translations.find((row) => row.locale === locale);
    if (!translation) continue;

    await switchSkillLanguage(page, locale);

    if (translation.description) {
      await page
        .locator(`#skill-description-${locale}`)
        .fill(translation.description);
    }

    if (translation.urlWiki) {
      await page.locator(`#skill-wiki-${locale}`).fill(translation.urlWiki);
    }
  }

  await selectSkillType(page, skill.type);

  const createResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/trpc/portfolioAdmin.createSkill") &&
      response.request().method() === "POST" &&
      response.ok(),
    { timeout: 30_000 },
  );

  await page.locator("#skill-form-submit").click();

  await assertCreateSkillSucceeded(await createResponse);

  if (verifyInList) {
    await expectSkillListContains(page, skill.title);
  } else {
    await waitForSkillSaveToFinish(page);
  }
}

export async function expectSkillListContains(
  page: Page,
  title: string,
): Promise<void> {
  await goToSkillsList(page);

  // Pagination default is 10; show all fixture rows for assertions only.
  if (!page.url().includes("perPage=")) {
    await page.goto(`${page.url().split("?")[0]}?perPage=100`, {
      waitUntil: "domcontentloaded",
    });
  }

  await page
    .getByRole("cell", { name: title, exact: true })
    .waitFor({ timeout: 15_000 });
}

export async function cleanupUserSkills(page: Page): Promise<void> {
  const listResponse = await page.request.get(
    `/api/trpc/portfolioAdmin.getMySkills?batch=1&input=${encodeURIComponent(
      JSON.stringify({ "0": { json: null } }),
    )}`,
  );

  if (!listResponse.ok()) {
    throw new Error(
      `Failed to list skills for cleanup: ${listResponse.status()} ${await listResponse.text()}`,
    );
  }

  const listPayload = (await listResponse.json()) as [
    {
      result?: {
        data?: {
          json?: { id: string; title: string }[];
        };
      };
    },
  ];

  const skills = listPayload[0]?.result?.data?.json ?? [];

  for (const skill of skills) {
    const deleteResponse = await page.request.post(
      "/api/trpc/portfolioAdmin.deleteSkill?batch=1",
      {
        headers: { "content-type": "application/json" },
        data: { "0": { json: { id: skill.id } } },
      },
    );

    if (!deleteResponse.ok()) {
      throw new Error(
        `Failed to delete skill "${skill.title}": ${deleteResponse.status()} ${await deleteResponse.text()}`,
      );
    }
  }
}

export { portfolioSkills };
