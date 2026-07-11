import type { Page, Response } from "@playwright/test";

import {
  portfolioTimeline,
  type PortfolioTimelineItemFixture,
} from "../fixtures/portfolio-timeline";

const TIMELINE_LOCALES = ["es", "en", "nl"] as const;

type TimelineMineItem = {
  id: string;
  organization: string;
  category: string;
  current: boolean;
  startDate: string;
  translations: Record<string, { title: string; description: string }>;
};

type AppLanguageRow = { id: string; code: string };

type FillTimelineFormOptions = {
  verifyInList?: boolean;
};

const CATEGORY_LABELS: Record<
  PortfolioTimelineItemFixture["category"],
  RegExp
> = {
  WORK: /work|trabajo|werk/i,
  STUDY: /study|estudio|studie/i,
  COURSE: /course|curso|cursus/i,
};

function trpcGetInput(procedure: string, input: unknown = null): string {
  return `/api/trpc/${procedure}?batch=1&input=${encodeURIComponent(
    JSON.stringify({ "0": { json: input } }),
  )}`;
}

export function extractLocalizedText(
  item: Pick<TimelineMineItem, "translations"> | undefined,
  languages: AppLanguageRow[],
  locale: string,
  field: "title" | "description" = "title",
): string {
  if (!item) return "";

  const language = languages.find((row) => row.code === locale);
  if (!language) return "";

  return item.translations[language.id]?.[field] ?? "";
}

export async function getAppLanguages(page: Page): Promise<AppLanguageRow[]> {
  const response = await page.request.get(
    trpcGetInput("appLanguagesAdmin.getAll"),
  );
  if (!response.ok()) {
    throw new Error(
      `appLanguagesAdmin.getAll failed: ${response.status()} ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as [
    { result?: { data?: { json?: AppLanguageRow[] } } },
  ];
  return payload[0]?.result?.data?.json ?? [];
}

export function timelineListTitle(item: PortfolioTimelineItemFixture): string {
  return item.title.en;
}

function timelineNavLink(page: Page) {
  return page
    .locator('a[href*="/admin/timeline"]')
    .filter({ hasNot: page.locator('[href*="/new"], [href*="/edit"]') })
    .first();
}

export async function goToTimelineList(page: Page): Promise<void> {
  const addButton = page.locator("#timeline-add");
  if (await addButton.isVisible()) {
    return;
  }

  const navLink = timelineNavLink(page);
  await navLink.waitFor({ state: "visible", timeout: 15_000 });
  await navLink.click();
  await page.waitForURL(/\/admin\/timeline(\?|$)/, { timeout: 20_000 });
  await addButton.waitFor({ state: "visible", timeout: 15_000 });
}

async function openNewTimelineForm(page: Page): Promise<void> {
  await goToTimelineList(page);

  const addButton = page.locator("#timeline-add");
  await addButton.scrollIntoViewIfNeeded();
  await addButton.waitFor({ state: "visible", timeout: 15_000 });
  await addButton.click();

  await page.waitForURL(/\/admin\/timeline\/new\/?$/, { timeout: 20_000 });
}

async function waitForTimelineSaveToFinish(page: Page): Promise<void> {
  await page.waitForURL((url) => !url.pathname.endsWith("/new"), {
    timeout: 30_000,
  });

  const addButton = page.locator("#timeline-add");
  if (!(await addButton.isVisible())) {
    await goToTimelineList(page);
  }

  await addButton.waitFor({ state: "visible", timeout: 15_000 });
}

async function assertCreateTimelineSucceeded(
  response: Response,
): Promise<void> {
  const text = await response.text().catch(() => "");
  if (!response.ok()) {
    throw new Error(
      `createItem request failed: ${response.status()} ${text}`.trim(),
    );
  }

  if (!text.trim()) return;

  try {
    const payload = JSON.parse(text) as [
      { error?: { json?: { message?: string } } },
    ];
    const message = payload[0]?.error?.json?.message;
    if (message) {
      throw new Error(`createItem mutation failed: ${message}`);
    }
  } catch (error) {
    if (error instanceof SyntaxError) return;
    throw error;
  }
}

async function setCurrentSwitch(
  page: Page,
  shouldBeCurrent: boolean,
): Promise<void> {
  const currentSwitch = page.locator("#timeline-current").getByRole("switch");
  const isChecked = await currentSwitch.getAttribute("aria-checked");
  const checked = isChecked === "true";

  if (checked !== shouldBeCurrent) {
    await currentSwitch.click();
  }
}

export async function fillTimelineItemForm(
  page: Page,
  item: PortfolioTimelineItemFixture,
  options: FillTimelineFormOptions = {},
): Promise<void> {
  const { verifyInList = true } = options;

  await openNewTimelineForm(page);

  for (const locale of TIMELINE_LOCALES) {
    await page.locator(`#timeline-lang-${locale}`).click();
    await page.locator(`#timeline-title-${locale}`).fill(item.title[locale]);
    await page
      .locator(`#timeline-description-${locale}`)
      .fill(item.description[locale]);
  }

  await page.locator("#timeline-organization").fill(item.organization);

  if (item.location) {
    await page.locator("#timeline-location").fill(item.location);
  }

  await page.locator("#timeline-category").click();
  await page
    .getByRole("option", { name: CATEGORY_LABELS[item.category] })
    .click();

  await page.locator("#timeline-start-date").fill(item.startDate);

  await setCurrentSwitch(page, item.current);

  if (!item.current && item.endDate) {
    await page.locator("#timeline-end-date").fill(item.endDate);
  }

  const createResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/trpc/timelineAdmin.createItem") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );

  await page.locator("#timeline-form-submit").click();
  await assertCreateTimelineSucceeded(await createResponse);

  if (verifyInList) {
    await expectTimelineListContains(page, timelineListTitle(item));
  } else {
    await waitForTimelineSaveToFinish(page);
  }
}

function timelineListRow(page: Page, title: string) {
  return page
    .locator("table tbody tr")
    .filter({ has: page.getByText(title, { exact: true }) })
    .first();
}

export async function expectTimelineListContains(
  page: Page,
  title: string,
): Promise<void> {
  await waitForTimelineSaveToFinish(page);

  const row = timelineListRow(page, title);
  await row.waitFor({ timeout: 15_000 });
}

export async function fillTimelineFromFixture(
  page: Page,
  items: PortfolioTimelineItemFixture[] = portfolioTimeline.items,
): Promise<void> {
  for (const [index, item] of items.entries()) {
    const isLast = index === items.length - 1;
    await fillTimelineItemForm(page, item, { verifyInList: isLast });
  }
}

export async function fillTimelineSmoke(
  page: Page,
  item: PortfolioTimelineItemFixture,
): Promise<void> {
  await fillTimelineItemForm(page, item);
}

export async function getTimelineMine(page: Page): Promise<TimelineMineItem[]> {
  const response = await page.request.get(
    trpcGetInput("timelineAdmin.getMine"),
  );
  if (!response.ok()) {
    throw new Error(
      `timelineAdmin.getMine failed: ${response.status()} ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as [
    { result?: { data?: { json?: TimelineMineItem[] } } },
  ];
  return payload[0]?.result?.data?.json ?? [];
}

export async function cleanupUserTimeline(page: Page): Promise<void> {
  const deleteResponse = await page.request.post(
    `/api/trpc/timelineAdmin.deleteAll?batch=1`,
    {
      data: {
        "0": { json: null },
      },
    },
  );

  if (!deleteResponse.ok()) {
    throw new Error(
      `Failed to cleanup cleanupUserTimeline: ${deleteResponse.status()} ${await deleteResponse.text()}`,
    );
  }
}
