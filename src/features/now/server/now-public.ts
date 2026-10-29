import type { PublicStatusSlot } from "../lib/status-schedule";
import "server-only";
import { getGitHubContributions } from "./github-contributions";
import { getGitHubActivity } from "./github-activity";
import type { GitHubActivity } from "../lib/github-activity";
import type { GitHubContributions } from "../lib/github-contributions";

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
  githubContributions: GitHubContributions;
  githubActivity: GitHubActivity;
  statusEmoji: string;
  statusSchedule: PublicStatusSlot[];
  readingCoverUrl: string | null;
  watchedCoverUrl: string | null;
  readingTitle: string | null;
  readingAuthors: string | null;
  readingProgress: number;
  watchedTitle: string | null;
  watchedRating: number;
  photoUrls: string[];
  statusBody: string;
  statusRelative: string;
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
        statusSchedule: {
          include: { translations: { include: { language: true } } },
          orderBy: [{ startMinute: "asc" }, { id: "asc" }],
        },
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

  const [githubContributions, githubActivity] = await Promise.all([
    getGitHubContributions(tenant.userId, settings.githubUsername),
    getGitHubActivity(tenant.userId, settings.githubUsername),
  ]);
  return {
    timezone: settings.timezone,
    githubUsername: settings.githubUsername,
    githubContributions,
    githubActivity,
    statusEmoji: settings.statusEmoji,
    statusSchedule: settings.statusSchedule.map((slot) => {
      const row =
        slot.translations.find(
          (row) => row.language.code === locale && row.body.trim(),
        ) ??
        slot.translations.find(
          (row) => row.language.code === "en" && row.body.trim(),
        ) ??
        slot.translations.find((row) => row.body.trim());
      return {
        id: slot.id,
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
        weekdays: slot.weekdays,
        emoji: slot.emoji,
        body: row?.body ?? "",
      };
    }),
    readingCoverUrl: settings.readingCoverUrl,
    watchedCoverUrl: settings.watchedCoverUrl,
    readingTitle: settings.readingTitle,
    readingAuthors: settings.readingAuthors,
    readingProgress: settings.readingProgress,
    watchedTitle: settings.watchedTitle,
    watchedRating: settings.watchedRating,
    photoUrls: settings.photoUrls,
    statusBody: translation?.statusBody ?? "",
    statusRelative: translation?.statusRelative ?? "",
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
