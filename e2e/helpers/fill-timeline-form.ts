import { expect, type Page, type Response } from "@playwright/test";

import {
  ensureAdminOrigin,
  gotoAdminPath,
  isAdminCollectionListUrl,
  waitForAdminListAfterSave,
} from "./admin-origin";
import {
  portfolioTimeline,
  type PortfolioTimelineItemFixture,
} from "../fixtures/portfolio-timeline";

const TIMELINE_LOCALES = ["es", "en", "nl"] as const;

interface TimelineMineItem {
  id: string;
  organization: string;
  category: string;
  current: boolean;
  startDate: string;
  translations: Record<string, { title: string; description: string }>;
}

interface AppLanguageRow {
  id: string;
  code: string;
}

interface FillTimelineFormOptions {
  verifyInList?: boolean;
}

const CATEGORY_LABELS: Record<
  PortfolioTimelineItemFixture["category"],
  RegExp
> = {
  WORK: /work|trabajo|werk/i,
  STUDY: /study|estudio|studie/i,
  COURSE: /course|curso|cursus/i,
};

function trpcGetInput(procedure: string, input: unknown = {}): string {
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
  await ensureAdminOrigin(page);
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

export async function goToTimelineList(page: Page): Promise<void> {
  const formOpen = await page.locator("#timeline-lang-es").isVisible();
  if (
    isAdminCollectionListUrl(page, "timeline") &&
    !formOpen &&
    (await page.locator("#timeline-add").isVisible())
  ) {
    return;
  }

  await gotoAdminPath(page, "/admin/timeline");
  await page
    .locator("#timeline-add")
    .waitFor({ state: "visible", timeout: 15_000 });
}

async function openNewTimelineForm(page: Page): Promise<void> {
  await goToTimelineList(page);

  const addButton = page.locator("#timeline-add");
  await addButton.scrollIntoViewIfNeeded();
  await addButton.waitFor({ state: "visible", timeout: 15_000 });
  await addButton.click();

  await page.waitForURL(/\/admin\/timeline\/new\/?$/, { timeout: 20_000 });
  await page.locator("#timeline-lang-es").waitFor({
    state: "visible",
    timeout: 20_000,
  });
}

async function waitForTimelineSaveToFinish(page: Page): Promise<void> {
  await waitForAdminListAfterSave(page, "timeline", "timeline-add");
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

  const [createResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/trpc/timelineAdmin.createItem") &&
        response.request().method() === "POST",
      { timeout: 30_000 },
    ),
    page.locator("#timeline-form-submit").click(),
  ]);
  await assertCreateTimelineSucceeded(createResponse);

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

export async function getTimelineMine(page: Page): Promise<{
  data: TimelineMineItem[];
  pageCount: number;
  totalCount: number;
}> {
  await ensureAdminOrigin(page);
  const response = await page.request.get(
    trpcGetInput("timelineAdmin.getMine", {
      page: 1,
      perPage: 100,
      sort: [],
      filters: [],
    }),
  );
  if (!response.ok()) {
    throw new Error(
      `timelineAdmin.getMine failed: ${response.status()} ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as [
    {
      result?: {
        data?: {
          json?: {
            data: TimelineMineItem[];
            pageCount: number;
            totalCount: number;
          };
        };
      };
    },
  ];
  return (
    payload[0]?.result?.data?.json ?? { data: [], pageCount: 0, totalCount: 0 }
  );
}

export async function cleanupUserTimeline(page: Page): Promise<void> {
  await ensureAdminOrigin(page);
  const deleteResponse = await page.request.post(
    `/api/trpc/timelineAdmin.deleteAll?batch=1`,
    {
      headers: { "content-type": "application/json" },
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

  await expect
    .poll(async () => (await getTimelineMine(page)).totalCount, {
      timeout: 15_000,
    })
    .toBe(0);
}
