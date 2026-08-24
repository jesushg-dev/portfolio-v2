import { expect, test } from "./authenticated-test";
import { getWorkerAuthFile } from "./helpers/auth-state";

import { portfolioCv } from "./fixtures/portfolio-cv";
import {
  cleanupUserProfile,
  fillProfileConsoleFromFixture,
  fillProfileHeroFromFixture,
  getHeroTitlesMine,
  getTerminalMine,
  portfolioHome,
} from "./helpers/fill-profile-form";

test.setTimeout(30 * 60 * 1000);

test.describe.configure({ mode: "serial" });

test.describe("profile create", () => {
  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      storageState: getWorkerAuthFile(testInfo.workerIndex),
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

    const heroTitles = await getHeroTitlesMine(page);
    expect(heroTitles.titles).toHaveLength(portfolioHome.heroTitles.length);

    const terminal = await getTerminalMine(page);
    expect(terminal?.username).toBe(portfolioHome.terminal.username);
    expect(terminal?.steps).toHaveLength(portfolioHome.terminal.steps.length);

    const whoamiStep = terminal?.steps.find((step) =>
      Object.values(step.translations).some(
        (translation) => translation.command === "whoami",
      ),
    );
    expect(whoamiStep).toBeDefined();
    expect(
      Object.values(whoamiStep?.translations ?? {}).some((translation) =>
        translation.output.includes("jesus-hernandez"),
      ),
    ).toBe(true);

    const profileJsonStep = terminal?.steps.find((step) =>
      Object.values(step.translations).some((translation) =>
        translation.command.includes("profile.json"),
      ),
    );
    expect(profileJsonStep).toBeDefined();
    expect(
      Object.values(profileJsonStep?.translations ?? {}).some((translation) =>
        translation.output.includes(portfolioCv.header.fullName),
      ),
    ).toBe(true);
  });
});
