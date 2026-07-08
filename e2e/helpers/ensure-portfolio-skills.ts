import type { Page } from "@playwright/test";

import {
  portfolioSkills,
  type PortfolioSkillFixture,
} from "../fixtures/portfolio-skills";

type AppLanguageRow = { id: string; code: string };

function trpcGetInput(procedure: string, input: unknown = null): string {
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

function buildSkillCreateInput(
  skill: PortfolioSkillFixture,
  langIds: Record<"es" | "en" | "nl", string>,
) {
  return {
    title: skill.title,
    image: skill.image,
    type: skill.type,
    translations: skill.translations.map((translation) => ({
      appLanguageId: langIds[translation.locale],
      description: translation.description,
      urlWiki: translation.urlWiki,
    })),
  };
}

/** Ensures all fixture skills exist for the logged-in user (via tRPC, not UI). */
export async function ensurePortfolioSkills(page: Page): Promise<void> {
  const languages = await trpcQuery<AppLanguageRow[]>(
    page,
    "portfolioAdmin.getAppLanguages",
  );

  const esId = languages.find((lang) => lang.code === "es")?.id;
  const enId = languages.find((lang) => lang.code === "en")?.id;
  const nlId = languages.find((lang) => lang.code === "nl")?.id;

  if (!esId || !enId || !nlId) {
    throw new Error("Expected es, en, and nl app languages in the database");
  }

  const langIds: Record<"es" | "en" | "nl", string> = {
    es: esId,
    en: enId,
    nl: nlId,
  };

  const existing = await trpcQuery<{ title: string }[]>(
    page,
    "portfolioAdmin.getMySkills",
  );
  const existingTitles = new Set(existing.map((skill) => skill.title));

  for (const skill of portfolioSkills) {
    if (existingTitles.has(skill.title)) continue;

    await trpcMutate(
      page,
      "portfolioAdmin.createSkill",
      buildSkillCreateInput(skill, langIds),
    );
    existingTitles.add(skill.title);
  }
}
