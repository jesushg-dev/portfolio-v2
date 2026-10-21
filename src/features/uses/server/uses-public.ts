import "server-only";

import type { Locale } from "@/i18n/config";
import { db } from "@/server/db";
import { resolveTenant } from "@/lib/tenant/resolve";

export interface UsesPublicItem {
  id: string;
  href: string;
  image: string | null;
  title: string;
  description: string | null;
}

export interface UsesPublicPageData {
  settings: {
    workspaceImage: string | null;
    codingPreviewLight: string | null;
    codingPreviewDark: string | null;
    codingIntro: string | null;
    browserIntro: string | null;
    clarifications: string[];
    workspaceTags: {
      itemId: string;
      title: string;
      xPercent: number;
      yPercent: number;
    }[];
  };
  everyday: UsesPublicItem[];
  software: UsesPublicItem[];
  browser: UsesPublicItem[];
}

function mapItem(
  item: {
    id: string;
    href: string;
    image: string | null;
    UsesItemTranslation: {
      title: string;
      description: string | null;
      language: { code: string };
    }[];
  },
  locale: Locale,
): UsesPublicItem {
  const preferred =
    item.UsesItemTranslation.find((t) => t.language.code === locale) ??
    item.UsesItemTranslation.find((t) => t.language.code === "en") ??
    item.UsesItemTranslation[0];

  return {
    id: item.id,
    href: item.href,
    image: item.image,
    title: preferred?.title ?? "",
    description: preferred?.description ?? null,
  };
}

function pickLocaleText(
  rows: { text: string; language: { code: string } }[],
  locale: Locale,
): string {
  const preferred =
    rows.find((row) => row.language.code === locale) ??
    rows.find((row) => row.language.code === "en") ??
    rows[0];
  return preferred?.text?.trim() ?? "";
}

export async function getUsesPageData(
  locale: Locale,
): Promise<UsesPublicPageData | null> {
  const tenant = await resolveTenant();
  if (!tenant) return null;

  const [settings, items] = await Promise.all([
    db.usesSettings.findUnique({
      where: { userId: tenant.userId },
      include: {
        UsesSettingsTranslation: { include: { language: true } },
        UsesClarification: {
          orderBy: { order: "asc" },
          include: {
            UsesClarificationTranslation: { include: { language: true } },
          },
        },
        UsesWorkspaceTag: {
          orderBy: { order: "asc" },
          include: {
            UsesItem: {
              include: {
                UsesItemTranslation: { include: { language: true } },
              },
            },
          },
        },
      },
    }),
    db.usesItem.findMany({
      where: { userId: tenant.userId },
      include: {
        UsesItemTranslation: { include: { language: true } },
      },
      orderBy: { order: "asc" },
    }),
  ]);

  const settingsTranslation =
    settings?.UsesSettingsTranslation.find((t) => t.language.code === locale) ??
    settings?.UsesSettingsTranslation.find((t) => t.language.code === "en") ??
    settings?.UsesSettingsTranslation[0];

  const clarifications =
    settings?.UsesClarification.map((clarification) =>
      pickLocaleText(
        clarification.UsesClarificationTranslation.map((row) => ({
          text: row.body,
          language: row.language,
        })),
        locale,
      ),
    ).filter(Boolean) ?? [];

  const everyday = items
    .filter((item) => item.type === "EVERYDAY")
    .map((item) => mapItem(item, locale));
  const software = items
    .filter((item) => item.type === "SOFTWARE")
    .map((item) => mapItem(item, locale));
  const browser = items
    .filter((item) => item.type === "BROWSER")
    .map((item) => mapItem(item, locale));

  const visibleItemIds = new Set(
    [...everyday, ...software]
      .filter((item) => Boolean(item.image))
      .map((item) => item.id),
  );

  const workspaceTags =
    settings?.UsesWorkspaceTag?.flatMap((tag) => {
      if (!visibleItemIds.has(tag.usesItemId)) return [];
      const mapped = mapItem(tag.UsesItem, locale);
      if (!mapped.title) return [];
      return [
        {
          itemId: tag.usesItemId,
          title: mapped.title,
          xPercent: tag.xPercent,
          yPercent: tag.yPercent,
        },
      ];
    }) ?? [];

  return {
    settings: {
      workspaceImage: settings?.workspaceImage ?? null,
      codingPreviewLight: settings?.codingPreviewLight ?? null,
      codingPreviewDark: settings?.codingPreviewDark ?? null,
      codingIntro: settingsTranslation?.codingIntro?.trim() ?? null,
      browserIntro: settingsTranslation?.browserIntro?.trim() ?? null,
      clarifications,
      workspaceTags,
    },
    everyday,
    software,
    browser,
  };
}
