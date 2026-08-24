import type { Page } from "@playwright/test";

import { ensureAdminOrigin } from "./admin-origin";
import {
  portfolioSkills,
  type PortfolioSkillFixture,
} from "../fixtures/portfolio-skills";

interface AppLanguageRow {
  id: string;
  code: string;
}
interface SkillRow {
  title: string;
}

function trpcGetInput(procedure: string, input: unknown = {}): string {
  return `/api/trpc/${procedure}?batch=1&input=${encodeURIComponent(
    JSON.stringify({ "0": { json: input } }),
  )}`;
}

async function executeTrpcQuery<T>(page: Page, procedure: string): Promise<T> {
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
  const translations: Record<string, { description: string; urlWiki: string }> =
    {};
  for (const tr of skill.translations) {
    const langId = langIds[tr.locale];
    if (langId) {
      translations[langId] = {
        description: tr.description,
        urlWiki: tr.urlWiki ?? "",
      };
    }
  }

  return {
    title: skill.title,
    image: skill.image,
    type: skill.type,
    translations,
  };
}

type SkillsResponse = { data: SkillRow[] } | SkillRow[];

/** Creates any missing fixture skills via tRPC (does not delete existing skills). */
export async function ensurePortfolioSkills(page: Page): Promise<void> {
  await ensureAdminOrigin(page);
  const response = await executeTrpcQuery<SkillsResponse>(
    page,
    "skillsAdmin.getMine",
  );
  const existing = Array.isArray(response) ? response : response.data;
  const existingTitles = new Set(existing.map((skill) => skill.title));

  const missing = portfolioSkills.filter(
    (skill) => !existingTitles.has(skill.title),
  );
  if (missing.length === 0) {
    return;
  }

  const languages = await executeTrpcQuery<AppLanguageRow[]>(
    page,
    "appLanguagesAdmin.getAll",
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

  for (const skill of missing) {
    await trpcMutate(
      page,
      "skillsAdmin.createItem",
      buildSkillCreateInput(skill, langIds),
    );
  }
}
