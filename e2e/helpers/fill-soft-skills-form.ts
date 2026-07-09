import type { Page, Response } from "@playwright/test";

import {
  portfolioSoftSkills,
  type PortfolioSoftSkillItemFixture,
  type PortfolioSoftSkillsFixture,
} from "../fixtures/portfolio-soft-skills";

const SOFT_SKILL_LOCALES = ["es", "en", "nl"] as const;

type SoftSkillMineItem = {
  id: string;
  icon: string;
  order: number;
  isVisible: boolean;
  title: unknown;
  description: unknown;
};

type SoftSkillsSection = {
  mediaType: "VIDEO" | "IMAGE";
  videoUrl: string | null;
  posterUrl: string | null;
  imageUrl: string | null;
};

type FillSoftSkillFormOptions = {
  verifyInList?: boolean;
};

function trpcGetInput(procedure: string, input: unknown = null): string {
  return `/api/trpc/${procedure}?batch=1&input=${encodeURIComponent(
    JSON.stringify({ "0": { json: input } }),
  )}`;
}

export function extractLocalizedText(raw: unknown, locale: string): string {
  if (!raw || typeof raw !== "object") return "";
  const obj = raw as Record<string, unknown>;
  const defaultText = typeof obj.default === "string" ? obj.default : "";
  const translations = obj.translations as Record<string, string> | undefined;
  return translations?.[locale] ?? defaultText;
}

export function softSkillListTitle(
  item: PortfolioSoftSkillItemFixture,
): string {
  return item.title.en;
}

function softSkillsNavLink(page: Page) {
  return page
    .locator('a[href*="/admin/soft-skills"]')
    .filter({
      hasNot: page.locator(
        '[href*="/new"], [href*="/edit"], [href*="/settings"]',
      ),
    })
    .first();
}

export async function goToSoftSkillsList(page: Page): Promise<void> {
  const addButton = page.locator("#soft-skills-add");
  if (await addButton.isVisible()) {
    return;
  }

  const navLink = softSkillsNavLink(page);
  await navLink.waitFor({ state: "visible", timeout: 15_000 });
  await navLink.click();
  await page.waitForURL(/\/admin\/soft-skills(\?|$)/, { timeout: 20_000 });
  await addButton.waitFor({ state: "visible", timeout: 15_000 });
}

async function openSoftSkillsSettings(page: Page): Promise<void> {
  await goToSoftSkillsList(page);

  const settingsButton = page.locator("#soft-skills-settings");
  await settingsButton.scrollIntoViewIfNeeded();
  await settingsButton.waitFor({ state: "visible", timeout: 15_000 });
  await settingsButton.click();
  await page.waitForURL(/\/admin\/soft-skills\/settings\/?$/, {
    timeout: 20_000,
  });
}

async function openNewSoftSkillForm(page: Page): Promise<void> {
  await goToSoftSkillsList(page);

  const addButton = page.locator("#soft-skills-add");
  await addButton.scrollIntoViewIfNeeded();
  await addButton.waitFor({ state: "visible", timeout: 15_000 });
  await addButton.click();
  await page.waitForURL(/\/admin\/soft-skills\/new\/?$/, { timeout: 20_000 });
}

async function waitForSoftSkillSaveToFinish(page: Page): Promise<void> {
  await page.waitForURL((url) => !url.pathname.endsWith("/new"), {
    timeout: 30_000,
  });

  const addButton = page.locator("#soft-skills-add");
  if (!(await addButton.isVisible())) {
    await goToSoftSkillsList(page);
  }

  await addButton.waitFor({ state: "visible", timeout: 15_000 });
}

async function waitForSectionSaveToFinish(page: Page): Promise<void> {
  await page.waitForURL((url) => !url.pathname.endsWith("/settings"), {
    timeout: 30_000,
  });

  await goToSoftSkillsList(page);
}

async function assertMutationSucceeded(
  response: Response,
  label: string,
): Promise<void> {
  const text = await response.text().catch(() => "");
  if (!response.ok()) {
    throw new Error(
      `${label} request failed: ${response.status()} ${text}`.trim(),
    );
  }

  if (!text.trim()) return;

  try {
    const payload = JSON.parse(text) as [
      { error?: { json?: { message?: string } } },
    ];
    const message = payload[0]?.error?.json?.message;
    if (message) {
      throw new Error(`${label} mutation failed: ${message}`);
    }
  } catch (error) {
    if (error instanceof SyntaxError) return;
    throw error;
  }
}

async function setVisibleSwitch(
  page: Page,
  shouldBeVisible: boolean,
): Promise<void> {
  const visibleSwitch = page.locator("#soft-skill-visible").getByRole("switch");
  const isChecked = await visibleSwitch.getAttribute("aria-checked");
  const checked = isChecked === "true";

  if (checked !== shouldBeVisible) {
    await visibleSwitch.click();
  }
}

export async function fillSoftSkillsSectionFromFixture(
  page: Page,
  section: PortfolioSoftSkillsFixture["section"] = portfolioSoftSkills.section,
): Promise<void> {
  await openSoftSkillsSettings(page);

  await page.locator("#soft-skills-section-media-type").click();
  await page
    .getByRole("option", {
      name: section.mediaType === "VIDEO" ? /video/i : /image/i,
    })
    .click();

  if (section.mediaType === "VIDEO") {
    if (section.videoUrl) {
      await page
        .locator("#soft-skills-section-video-url")
        .fill(section.videoUrl);
    }
    if (section.posterUrl) {
      await page
        .locator("#soft-skills-section-poster-url")
        .fill(section.posterUrl);
    }
  } else if (section.imageUrl) {
    await page.locator("#soft-skills-section-image-url").fill(section.imageUrl);
  }

  const saveResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/trpc/softSkillsAdmin.upsertSection") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );

  await page.locator("#soft-skills-section-form-submit").click();
  await assertMutationSucceeded(await saveResponse, "upsertSection");
  await waitForSectionSaveToFinish(page);
}

export async function fillSoftSkillItemForm(
  page: Page,
  item: PortfolioSoftSkillItemFixture,
  options: FillSoftSkillFormOptions = {},
): Promise<void> {
  const { verifyInList = true } = options;

  await openNewSoftSkillForm(page);

  await page.locator("#soft-skill-icon").click();
  await page.getByRole("option", { name: item.icon, exact: true }).click();

  await setVisibleSwitch(page, true);
  await page.locator("#soft-skill-order").fill(String(item.order));

  for (const locale of SOFT_SKILL_LOCALES) {
    await page.locator(`#soft-skill-lang-${locale}`).click();
    await page.locator("#soft-skill-title").fill(item.title[locale]);
    await page
      .locator("#soft-skill-description")
      .fill(item.description[locale]);
  }

  const createResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/trpc/softSkillsAdmin.createItem") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );

  await page.locator("#soft-skill-form-submit").click();
  await assertMutationSucceeded(await createResponse, "createItem");

  if (verifyInList) {
    await expectSoftSkillListContains(page, softSkillListTitle(item));
  } else {
    await waitForSoftSkillSaveToFinish(page);
  }
}

function softSkillListRow(page: Page, title: string) {
  return page
    .locator("table tbody tr")
    .filter({ has: page.getByText(title, { exact: true }) })
    .first();
}

export async function expectSoftSkillListContains(
  page: Page,
  title: string,
): Promise<void> {
  await waitForSoftSkillSaveToFinish(page);

  const row = softSkillListRow(page, title);
  await row.waitFor({ timeout: 15_000 });
}

export async function fillSoftSkillsFromFixture(
  page: Page,
  items: PortfolioSoftSkillItemFixture[] = portfolioSoftSkills.items,
): Promise<void> {
  await fillSoftSkillsSectionFromFixture(page);

  for (const [index, item] of items.entries()) {
    const isLast = index === items.length - 1;
    await fillSoftSkillItemForm(page, item, { verifyInList: isLast });
  }
}

export async function fillSoftSkillSmoke(
  page: Page,
  item: PortfolioSoftSkillItemFixture,
): Promise<void> {
  await fillSoftSkillItemForm(page, item);
}

export async function getSoftSkillsMine(
  page: Page,
): Promise<SoftSkillMineItem[]> {
  const response = await page.request.get(
    trpcGetInput("softSkillsAdmin.getMine"),
  );
  if (!response.ok()) {
    throw new Error(
      `softSkillsAdmin.getMine failed: ${response.status()} ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as [
    { result?: { data?: { json?: SoftSkillMineItem[] } } },
  ];
  return payload[0]?.result?.data?.json ?? [];
}

export async function getSoftSkillsSection(
  page: Page,
): Promise<SoftSkillsSection> {
  const response = await page.request.get(
    trpcGetInput("softSkillsAdmin.getSection"),
  );
  if (!response.ok()) {
    throw new Error(
      `softSkillsAdmin.getSection failed: ${response.status()} ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as [
    { result?: { data?: { json?: SoftSkillsSection } } },
  ];
  const section = payload[0]?.result?.data?.json;
  if (!section) {
    throw new Error("softSkillsAdmin.getSection returned no data");
  }
  return section;
}

export async function cleanupUserSoftSkills(page: Page): Promise<void> {
  const items = await getSoftSkillsMine(page);

  for (const item of items) {
    const deleteResponse = await page.request.post(
      "/api/trpc/softSkillsAdmin.deleteItem?batch=1",
      {
        headers: { "content-type": "application/json" },
        data: { "0": { json: { id: item.id } } },
      },
    );

    if (!deleteResponse.ok()) {
      throw new Error(
        `Failed to delete soft skill ${item.id}: ${deleteResponse.status()} ${await deleteResponse.text()}`,
      );
    }
  }
}

export { portfolioSoftSkills };
