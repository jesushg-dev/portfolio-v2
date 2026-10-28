import { selectFormLanguage } from "./admin-form";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { portfolioCv } from "../fixtures/portfolio-cv";
import {
  portfolioHome,
  type LocalizedFixture,
  type PortfolioHomeFixture,
} from "../fixtures/portfolio-home";
import { portfolioProfile } from "../fixtures/portfolio-profile";
import type { ProfileHeroEditorDTO } from "../../src/features/profile/lib/profile-hero-editor-dto";

const PROFILE_LOCALES = ["es", "en", "nl"] as const;
type ProfileLocale = (typeof PROFILE_LOCALES)[number];

interface AppLanguageRow {
  id: string;
  code: string;
}

interface CvHeaderMine {
  fullName: string;
  photoUrl: string | null;
  clientImageAlt: unknown;
}

interface CvMineHeaderResponse {
  header: CvHeaderMine | null;
}

interface TerminalMine {
  username: string;
  typingSpeed: number;
  delayBetweenCommands: number;
  steps: {
    order: number;
    translations: Record<string, { command: string; output: string }>;
  }[];
}

function trpcGetInput(procedure: string, input: unknown = {}): string {
  return `/api/trpc/${procedure}?batch=1&input=${encodeURIComponent(
    JSON.stringify({ "0": { json: input } }),
  )}`;
}

async function trpcQuery<T>(page: Page, procedure: string): Promise<T> {
  const response = await page.request.get(trpcGetInput(procedure));
  if (!response.ok()) {
    throw new Error(
      `tRPC query ${procedure} failed: ${response.status()} ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as [
    { result?: { data?: { json?: T } } },
  ];
  return payload[0]?.result?.data?.json as T;
}

async function trpcMutate(
  page: Page,
  procedure: string,
  input: unknown,
): Promise<void> {
  const response = await page.request.post(`/api/trpc/${procedure}?batch=1`, {
    headers: { "content-type": "application/json" },
    data: { "0": { json: input } },
  });

  if (!response.ok()) {
    throw new Error(
      `tRPC mutation ${procedure} failed: ${response.status()} ${await response.text()}`,
    );
  }
}

function profileNavLink(page: Page) {
  return page.locator('a[href="/admin/profile"]').first();
}

export async function goToProfileHero(page: Page): Promise<void> {
  if (/\/admin\/profile\/?$/.test(page.url())) {
    return;
  }

  if (!page.url().includes("/admin")) {
    await page.goto("/admin");
  }

  const navLink = profileNavLink(page);
  await navLink.waitFor({ state: "visible", timeout: 15_000 });
  await navLink.click();
  await page.waitForURL(/\/admin\/profile\/?$/, { timeout: 15_000 });
}

export async function goToProfileConsole(page: Page): Promise<void> {
  await goToProfileHero(page);
  await page.locator("#profile-tab-about").click();
  await page.waitForURL(/\/admin\/profile\/about\/?$/, { timeout: 15_000 });
  await page
    .locator("#profile-console-username")
    .waitFor({ state: "visible", timeout: 15_000 });
}

async function selectProfileLocale(
  page: Page,
  locale: ProfileLocale,
): Promise<void> {
  await selectFormLanguage(page, locale);
}

async function submitProfileHeroForm(page: Page): Promise<void> {
  const submit = page.getByRole("button", {
    name: "Save changes",
    exact: true,
  });
  const savePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/trpc/profileAdmin.upsertHero") &&
      response.request().method() === "POST" &&
      response.ok(),
    { timeout: 30_000 },
  );
  await submit.click();
  await savePromise;
  await expect(submit).toBeHidden({ timeout: 30_000 });
}

/** Clears profile-owned hero content, terminal steps, and about text. */
export async function cleanupUserProfile(page: Page): Promise<void> {
  const [cv, languages] = await Promise.all([
    trpcQuery<CvMineHeaderResponse>(page, "cv.getMine"),
    trpcQuery<AppLanguageRow[]>(page, "appLanguagesAdmin.getAll"),
  ]);

  await trpcMutate(page, "profileAdmin.upsertHero", {
    fullName: cv.header?.fullName ?? portfolioProfile.name,
    photoUrl: cv.header?.photoUrl ?? "",
  });

  if (cv.header) {
    await trpcMutate(page, "profileAdmin.upsertPortfolioHeader", {
      fullName: cv.header.fullName,
      photoUrl: cv.header.photoUrl,
      backgroundImageUrl: null,
      heroSummary: null,
      clientImageAlt: null,
    });
  }

  await trpcMutate(page, "terminal.upsert", {
    username: "Jesus-Macbook",
    typingSpeed: 45,
    delayBetweenCommands: 1000,
    steps: [
      {
        order: 0,
        translations: Object.fromEntries(
          languages.map((language) => [
            language.id,
            { command: "clear", output: "" },
          ]),
        ),
      },
    ],
  });

  await trpcMutate(page, "cv.upsertAboutMe", {
    aboutMe: Object.fromEntries(
      languages.map((language) => [language.id, { text: "." }]),
    ),
  });
}

export async function fillProfileHeroFromFixture(
  page: Page,
  fixture: PortfolioHomeFixture = portfolioHome,
): Promise<void> {
  await goToProfileHero(page);

  await page.locator("#profile-full-name").fill(portfolioCv.header.fullName);
  await page.locator("#profile-hero-photo-url").fill(portfolioProfile.photoUrl);

  for (const locale of PROFILE_LOCALES) {
    await selectProfileLocale(page, locale);

    await page
      .locator(`#profile-hero-summary-${locale}`)
      .fill(portfolioCv.aboutMe[locale]);

    await page
      .locator("#profile-tr-subtitle")
      .fill(fixture.heroSubtitle[locale]);
    await page.locator("#profile-tr-tagline").fill(fixture.heroTagline[locale]);
  }

  await submitProfileHeroForm(page);
}

async function countConsoleSteps(page: Page): Promise<number> {
  return page.locator('[id^="profile-console-command-"][id$="-en"]').count();
}

export async function fillProfileConsoleFromFixture(
  page: Page,
  fixture: PortfolioHomeFixture = portfolioHome,
): Promise<void> {
  await goToProfileConsole(page);

  await page
    .locator("#profile-console-username")
    .fill(fixture.terminal.username);
  await page
    .locator("#profile-console-typing-speed")
    .fill(String(fixture.terminal.typingSpeed));
  await page
    .locator("#profile-console-delay")
    .fill(String(fixture.terminal.delayBetweenCommands));

  const stepCount = fixture.terminal.steps.length;
  let visibleSteps = await countConsoleSteps(page);

  while (visibleSteps < stepCount) {
    await page.locator("#profile-console-add-step").click();
    visibleSteps = await countConsoleSteps(page);
  }

  for (const locale of PROFILE_LOCALES) {
    await selectProfileLocale(page, locale);

    for (const [index, step] of fixture.terminal.steps.entries()) {
      await page
        .locator(`#profile-console-command-${index}-${locale}`)
        .fill(step.command[locale]);
      await page
        .locator(`#profile-console-output-${index}-${locale}`)
        .fill(step.output[locale]);
    }
  }

  const submit = page.locator("#profile-console-submit");
  const savePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/trpc/terminal.upsert") &&
      response.request().method() === "POST" &&
      response.ok(),
    { timeout: 30_000 },
  );
  await submit.click();
  await savePromise;
  await expect(submit).toBeEnabled({ timeout: 30_000 });
  await expect(submit).not.toHaveText(/Saving/i);
}

export async function getHeroEditor(page: Page): Promise<ProfileHeroEditorDTO> {
  return trpcQuery<ProfileHeroEditorDTO>(page, "profileAdmin.getHeroEditor");
}

export async function getTerminalMine(
  page: Page,
): Promise<TerminalMine | null> {
  return trpcQuery<TerminalMine | null>(page, "terminal.getMine");
}

export async function fillProfileHeroSmoke(
  page: Page,
  title: LocalizedFixture = portfolioHome.heroSubtitle,
  heroSummary: LocalizedFixture = portfolioCv.aboutMe,
): Promise<void> {
  await goToProfileHero(page);

  await selectProfileLocale(page, "en");
  await page.locator("#profile-full-name").fill(portfolioCv.header.fullName);
  for (const locale of PROFILE_LOCALES) {
    await selectProfileLocale(page, locale);
    await page.locator("#profile-tr-subtitle").fill(title[locale]);
    await page
      .locator("#profile-tr-tagline")
      .fill(portfolioHome.heroTagline[locale]);
  }
  await selectProfileLocale(page, "en");
  await page.locator("#profile-tr-summary").fill(heroSummary.en);

  await submitProfileHeroForm(page);
}

export { portfolioHome };
