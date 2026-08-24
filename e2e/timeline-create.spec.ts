import { expect, test } from "./authenticated-test";
import { getWorkerAuthFile } from "./helpers/auth-state";

import { portfolioTimeline } from "./fixtures/portfolio-timeline";
import {
  cleanupUserTimeline,
  extractLocalizedText,
  fillTimelineFromFixture,
  getAppLanguages,
  getTimelineMine,
} from "./helpers/fill-timeline-form";

test.setTimeout(45 * 60 * 1000);

test.describe.configure({ mode: "serial" });

test.describe("timeline create", () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: getWorkerAuthFile(),
    });
    const page = await context.newPage();
    await cleanupUserTimeline(page);
    await context.close();
  });

  test("creates all timeline entries from the shared fixture", async ({
    page,
  }) => {
    await page.goto("/admin");
    await fillTimelineFromFixture(page);

    const [response, languages] = await Promise.all([
      getTimelineMine(page),
      getAppLanguages(page),
    ]);
    const items = response.data;
    expect(items.length).toBeGreaterThanOrEqual(portfolioTimeline.items.length);

    const studyItem = items.find(
      (row) => row.organization === "Universidad Nacional de Ingeniería",
    );
    expect(studyItem).toBeDefined();
    expect(studyItem?.category).toBe("STUDY");
    expect(studyItem?.current).toBe(false);

    const currentJobs = items.filter((row) => row.current);
    expect(currentJobs).toHaveLength(2);

    const imagemaker = items.find((row) => row.organization === "Imagemaker");
    expect(imagemaker).toBeDefined();
    expect(extractLocalizedText(imagemaker, languages, "en", "title")).toBe(
      "Senior Software Engineer",
    );

    const startDates = items.map((row) => new Date(row.startDate).getTime());
    expect(startDates).toEqual([...startDates].sort((a, b) => b - a));
  });
});
