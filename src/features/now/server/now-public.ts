import "server-only";

import type { Locale } from "@/i18n/config";
import { db } from "@/server/db";
import { resolveTenant } from "@/lib/tenant/resolve";

export interface NowPublicFocus {
  id: string;
  label: string;
  body: string;
}

export interface NowPublicPageData {
  timezone: string;
  githubUsername: string | null;
  statusEmoji: string;
  readingTitle: string | null;
  readingAuthors: string | null;
  readingProgress: number;
  watchedTitle: string | null;
  watchedRating: number;
  githubRepo: string | null;
  githubHref: string | null;
  photoUrls: string[];
  statusBody: string;
  statusRelative: string;
  githubBody: string;
  githubRelative: string;
  focuses: NowPublicFocus[];
}

export async function getNowPageData(
  locale: Locale,
): Promise<NowPublicPageData | null> {
  const tenant = await resolveTenant();
  if (!tenant) return null;

  const [settings, focuses] = await Promise.all([
    db.nowSettings.findUnique({
      where: { userId: tenant.userId },
      include: {
        NowSettingsTranslation: { include: { language: true } },
      },
    }),
    db.nowFocus.findMany({
      where: { userId: tenant.userId },
      include: {
        NowFocusTranslation: { include: { language: true } },
      },
      orderBy: { order: "asc" },
    }),
  ]);

  if (!settings) return null;

  const translation =
    settings.NowSettingsTranslation.find((t) => t.language.code === locale) ??
    settings.NowSettingsTranslation.find((t) => t.language.code === "en") ??
    settings.NowSettingsTranslation[0];

  return {
    timezone: settings.timezone,
    githubUsername: settings.githubUsername,
    statusEmoji: settings.statusEmoji,
    readingTitle: settings.readingTitle,
    readingAuthors: settings.readingAuthors,
    readingProgress: settings.readingProgress,
    watchedTitle: settings.watchedTitle,
    watchedRating: settings.watchedRating,
    githubRepo: settings.githubRepo,
    githubHref: settings.githubHref,
    photoUrls: settings.photoUrls,
    statusBody: translation?.statusBody ?? "",
    statusRelative: translation?.statusRelative ?? "",
    githubBody: translation?.githubBody ?? "",
    githubRelative: translation?.githubRelative ?? "",
    focuses: focuses.map((focus) => {
      const row =
        focus.NowFocusTranslation.find((t) => t.language.code === locale) ??
        focus.NowFocusTranslation.find((t) => t.language.code === "en") ??
        focus.NowFocusTranslation[0];
      return {
        id: focus.id,
        label: row?.label ?? "",
        body: row?.body ?? "",
      };
    }),
  };
}
