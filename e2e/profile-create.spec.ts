import { expect, test } from "./authenticated-test";
import { getWorkerAuthFile } from "./helpers/auth-state";

import {
  cleanupUserProfile,
  fillProfileConsoleFromFixture,
  fillProfileHeroFromFixture,
  getHeroEditor,
  getTerminalMine,
  portfolioHome,
} from "./helpers/fill-profile-form";

test.setTimeout(30 * 60 * 1000);

test.describe.configure({ mode: "serial" });

test.describe("profile create", () => {
  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      storageState: getWorkerAuthFile(testInfo.parallelIndex),
    });
    const page = await context.newPage();
    await cleanupUserProfile(page);
    await context.close();
  });

  test("creates portfolio profile hero and console from the shared fixture", async ({
    page,
  }) => {
    await page.goto("/admin");
    await fillProfileHeroFromFixture(page);
    await fillProfileConsoleFromFixture(page);

    const hero = await getHeroEditor(page);
    expect(
      Object.values(hero.heroSubtitleTranslations).map((entry) => entry.text),
    ).toEqual(
      expect.arrayContaining(Object.values(portfolioHome.heroSubtitle)),
    );

    const terminal = await getTerminalMine(page);
    expect(terminal?.username).toBe(portfolioHome.terminal.username);
    expect(terminal?.steps).toHaveLength(portfolioHome.terminal.steps.length);

    for (const [
      order,
      expectedStep,
    ] of portfolioHome.terminal.steps.entries()) {
      const actualStep = terminal?.steps.find((step) => step.order === order);
      expect(actualStep).toBeDefined();
      for (const locale of ["en", "es", "nl"] as const) {
        expect(Object.values(actualStep?.translations ?? {})).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              command: expectedStep.command[locale],
              output: expectedStep.output[locale],
            }),
          ]),
        );
      }
    }
  });
});
