import type { Page } from "@playwright/test";

import { ensureAdminOrigin } from "./admin-origin";
import {
  portfolioSoftSkills,
  type PortfolioSoftSkillItemFixture,
} from "../fixtures/portfolio-soft-skills";

interface AppLanguageRow {
  id: string;
  code: string;
}

interface SoftSkillMineItem {
  translations: Record<string, { title: string }>;
}

function trpcGetInput(procedure: string, input: unknown = {}): string {
  return `/api/trpc/${procedure}?batch=1&input=${encodeURIComponent(
    JSON.stringify({ "0": { json: input } }),
  )}`;
}

async function executeTrpcQuery<T>(
  page: Page,
  procedure: string,
  input: unknown = {},
): Promise<T> {
  const response = await page.request.get(trpcGetInput(procedure, input));
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

  if (response.ok()) return;

  throw new Error(
    `tRPC mutation ${procedure} failed: ${response.status()} ${await response.text()}`.trim(),
  );
}

function buildSoftSkillCreateInput(
  item: PortfolioSoftSkillItemFixture,
  langIds: Record<"es" | "en" | "nl", string>,
) {
  const translations: Record<
    string,
    { title: string; description: string; badge: string }
  > = {};

  for (const locale of ["es", "en", "nl"] as const) {
    const langId = langIds[locale];
    if (!langId) continue;
    translations[langId] = {
      title: item.title[locale],
      description: item.description[locale],
      badge: "",
    };
  }

  return {
    icon: item.icon,
    isVisible: true,
    featured: item.featured ?? false,
    order: item.order,
    translations,
  };
}

async function listMySoftSkillTitles(page: Page): Promise<Set<string>> {
  const titles = new Set<string>();
  const response = await executeTrpcQuery<{
    data: SoftSkillMineItem[];
    totalCount?: number;
  }>(page, "softSkillsAdmin.getMine", {
    page: 1,
    perPage: 100,
    sort: [],
    filters: [],
  });

  for (const row of response.data ?? []) {
    for (const translation of Object.values(row.translations ?? {})) {
      if (translation.title) titles.add(translation.title);
    }
  }

  return titles;
}

/** Creates any missing fixture soft skills via tRPC (does not delete existing). */
export async function ensurePortfolioSoftSkills(page: Page): Promise<void> {
  await ensureAdminOrigin(page);
  const existingTitles = await listMySoftSkillTitles(page);

  const missing = portfolioSoftSkills.items.filter(
    (item) => !existingTitles.has(item.title.en),
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

  for (const item of missing) {
    await trpcMutate(
      page,
      "softSkillsAdmin.createItem",
      buildSoftSkillCreateInput(item, langIds),
    );
  }
}
