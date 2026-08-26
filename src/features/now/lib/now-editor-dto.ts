import type {
  NowFocus,
  NowFocusTranslation,
  NowSettings,
  NowSettingsTranslation,
} from "@prisma/client";

import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  type TranslationMap,
  buildEmptyTranslationMap,
  mergeTranslationMap,
} from "@/lib/i18n/translation-map";

export interface NowSettingsTranslationFields {
  statusBody: string;
  statusRelative: string;
  githubBody: string;
  githubRelative: string;
}

export type NowSettingsTranslationMap =
  TranslationMap<NowSettingsTranslationFields>;

export interface NowSettingsEditorDTO {
  id: string;
  timezone: string;
  githubUsername: string;
  statusEmoji: string;
  readingTitle: string;
  readingAuthors: string;
  readingProgress: number;
  watchedTitle: string;
  watchedRating: number;
  githubRepo: string;
  githubHref: string;
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

export type NowFocusCreateFormDTO = Omit<NowFocusEditorDTO, "id">;

const emptySettingsTranslation: NowSettingsTranslationFields = {
  statusBody: "",
  statusRelative: "",
  githubBody: "",
  githubRelative: "",
};

const emptyFocusTranslation: NowFocusTranslationFields = {
  label: "",
  body: "",
};

type NowSettingsWithRelations = NowSettings & {
  NowSettingsTranslation: NowSettingsTranslation[];
};

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
      githubBody: translation.githubBody ?? "",
      githubRelative: translation.githubRelative ?? "",
    })) ?? [];

  return {
    id: settings.id,
    timezone: settings.timezone,
    githubUsername: settings.githubUsername ?? "",
    statusEmoji: settings.statusEmoji ?? "🚀",
    readingTitle: settings.readingTitle ?? "",
    readingAuthors: settings.readingAuthors ?? "",
    readingProgress: settings.readingProgress ?? 0,
    watchedTitle: settings.watchedTitle ?? "",
    watchedRating: settings.watchedRating ?? 0,
    githubRepo: settings.githubRepo ?? "",
    githubHref: settings.githubHref ?? "",
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
    readingTitle: "",
    readingAuthors: "",
    readingProgress: 0,
    watchedTitle: "",
    watchedRating: 0,
    githubRepo: "",
    githubHref: "",
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
    order: 0,
    translations: buildEmptyTranslationMap(languages, emptyFocusTranslation),
  };
}
