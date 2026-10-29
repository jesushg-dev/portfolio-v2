import type { Prisma } from "@prisma/client";
import type { StatusSlotInput } from "./status-schedule";
import type { NowFocus, NowFocusTranslation } from "@prisma/client";

import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  type TranslationMap,
  buildEmptyTranslationMap,
  mergeTranslationMap,
} from "@/lib/i18n/translation-map";

export interface NowSettingsTranslationFields {
  statusBody: string;
  statusRelative: string;
}

export type NowSettingsTranslationMap =
  TranslationMap<NowSettingsTranslationFields>;

export interface NowSettingsEditorDTO {
  id: string;
  timezone: string;
  githubUsername: string;
  statusEmoji: string;
  statusSchedule: StatusSlotInput[];
  readingCoverUrl: string;
  watchedCoverUrl: string;
  readingTitle: string;
  readingAuthors: string;
  readingProgress: number;
  watchedTitle: string;
  watchedRating: number;
  photoUrls: string[];
  translations: NowSettingsTranslationMap;
}

export interface NowFocusTranslationFields {
  label: string;
  body: string;
}

export type NowFocusTranslationMap = TranslationMap<NowFocusTranslationFields>;

export interface NowFocusEditorDTO {
  id: string;
  order: number;
  translations: NowFocusTranslationMap;
}

export type NowFocusCreateFormDTO = Omit<NowFocusEditorDTO, "id" | "order">;

const emptySettingsTranslation: NowSettingsTranslationFields = {
  statusBody: "",
  statusRelative: "",
};

const emptyFocusTranslation: NowFocusTranslationFields = {
  label: "",
  body: "",
};

export const nowSettingsEditorInclude = {
  NowSettingsTranslation: true,
  statusSchedule: {
    include: { translations: true },
    orderBy: [{ startMinute: "asc" }, { id: "asc" }],
  },
} satisfies Prisma.NowSettingsInclude;
type NowSettingsWithRelations = Prisma.NowSettingsGetPayload<{
  include: typeof nowSettingsEditorInclude;
}>;

type NowFocusWithRelations = NowFocus & {
  NowFocusTranslation: NowFocusTranslation[];
};

export function mapNowSettingsToEditorDto(
  settings: NowSettingsWithRelations,
  languages: LanguageRef[],
): NowSettingsEditorDTO {
  const rows =
    settings.NowSettingsTranslation?.map((translation) => ({
      appLanguageId: translation.appLanguageId,
      statusBody: translation.statusBody ?? "",
      statusRelative: translation.statusRelative ?? "",
    })) ?? [];

  return {
    id: settings.id,
    timezone: settings.timezone,
    githubUsername: settings.githubUsername ?? "",
    statusEmoji: settings.statusEmoji ?? "🚀",
    statusSchedule: (settings.statusSchedule ?? []).map((slot) => ({
      id: slot.id,
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
      weekdays: slot.weekdays,
      emoji: slot.emoji,
      translations: Object.fromEntries(
        (slot.translations ?? []).map((row) => [
          row.appLanguageId,
          { body: row.body },
        ]),
      ),
    })),
    readingCoverUrl: settings.readingCoverUrl ?? "",
    watchedCoverUrl: settings.watchedCoverUrl ?? "",
    readingTitle: settings.readingTitle ?? "",
    readingAuthors: settings.readingAuthors ?? "",
    readingProgress: settings.readingProgress ?? 0,
    watchedTitle: settings.watchedTitle ?? "",
    watchedRating: settings.watchedRating ?? 0,
    photoUrls: settings.photoUrls ?? [],
    translations: mergeTranslationMap(
      languages,
      rows,
      emptySettingsTranslation,
    ),
  };
}

export function buildEmptyNowSettingsDto(
  languages: LanguageRef[],
): Omit<NowSettingsEditorDTO, "id"> {
  return {
    timezone: "America/Mexico_City",
    githubUsername: "",
    statusEmoji: "🚀",
    statusSchedule: [],
    readingCoverUrl: "",
    watchedCoverUrl: "",
    readingTitle: "",
    readingAuthors: "",
    readingProgress: 0,
    watchedTitle: "",
    watchedRating: 0,
    photoUrls: [],
    translations: buildEmptyTranslationMap(languages, emptySettingsTranslation),
  };
}

export function mapNowFocusToEditorDto(
  focus: NowFocusWithRelations,
  languages: LanguageRef[],
): NowFocusEditorDTO {
  const rows =
    focus.NowFocusTranslation?.map((translation) => ({
      appLanguageId: translation.appLanguageId,
      label: translation.label ?? "",
      body: translation.body ?? "",
    })) ?? [];

  return {
    id: focus.id,
    order: focus.order,
    translations: mergeTranslationMap(languages, rows, emptyFocusTranslation),
  };
}

export function mapNowFocusesToEditorDto(
  focuses: NowFocusWithRelations[],
  languages: LanguageRef[],
): NowFocusEditorDTO[] {
  return focuses.map((focus) => mapNowFocusToEditorDto(focus, languages));
}

export function buildEmptyNowFocusCreateDto(
  languages: LanguageRef[],
): NowFocusCreateFormDTO {
  return {
    translations: buildEmptyTranslationMap(languages, emptyFocusTranslation),
  };
}
