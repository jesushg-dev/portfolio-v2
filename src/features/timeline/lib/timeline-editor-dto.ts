import type {
  AppLanguage,
  TimelineItem,
  TimelineItemTranslation,
} from "@prisma/client";

import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  buildEmptyTranslationMap,
  type TranslationMap,
} from "@/lib/i18n/translation-map";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";

export interface TimelineTranslationFields {
  title: string;
  description: string;
}

export type TimelineTranslationMap = TranslationMap<TimelineTranslationFields>;

export interface TimelineEditorDTO {
  id: string;
  organization: string;
  location: string | null;
  category: "WORK" | "STUDY" | "COURSE";
  startDate: Date;
  endDate: Date | null;
  current: boolean;
  images: string[];
  translations: TimelineTranslationMap;
}

export interface TimelineFormDTO {
  id?: string;
  organization: string;
  location: string;
  category: TimelineEditorDTO["category"];
  startDate: string;
  endDate: string;
  current: boolean;
  images: { url: string }[];
  translations: TimelineTranslationMap;
}

export type TimelineCreateFormDTO = Omit<TimelineFormDTO, "id">;

const emptyTimelineTranslationFields = { title: "", description: "" };

type TimelineLanguageRef = Pick<AppLanguage, "id" | "code">;

export type TimelineItemWithTranslations = TimelineItem & {
  TimelineItemTranslation?: TimelineItemTranslation[];
};

function formatDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  if (value instanceof Date) {
    return value.toISOString().split("T")[0] ?? "";
  }
  return value;
}

export function mapTimelineToEditorDto(
  item: TimelineItemWithTranslations,
  languages: TimelineLanguageRef[],
): TimelineEditorDTO {
  const images = Array.isArray(item.images)
    ? item.images.filter((url): url is string => typeof url === "string")
    : [];

  const translationsMap = item.TimelineItemTranslation ?? [];

  return {
    id: item.id,
    organization: item.organization,
    location: item.location,
    category: item.category,
    startDate: item.startDate,
    endDate: item.endDate,
    current: item.current,
    images,
    translations: Object.fromEntries(
      languages.map((language) => {
        const found = translationsMap.find(
          (t) => t.appLanguageId === language.id,
        );
        return [
          language.id,
          {
            title: found?.title ?? "",
            description: found?.description ?? "",
          },
        ];
      }),
    ),
  };
}

export function mapTimelinesToEditorDto(
  items: TimelineItemWithTranslations[],
  languages: TimelineLanguageRef[],
): TimelineEditorDTO[] {
  return items.map((item) => mapTimelineToEditorDto(item, languages));
}

export function mapTimelineToFormDto(
  editor: TimelineEditorDTO,
): TimelineFormDTO {
  return {
    id: editor.id,
    organization: editor.organization ?? "",
    location: editor.location ?? "",
    category: editor.category,
    startDate: formatDateInput(editor.startDate),
    endDate: formatDateInput(editor.endDate),
    current: editor.current ?? false,
    images:
      editor.images.length > 0 ? editor.images.map((url) => ({ url })) : [],
    translations: editor.translations,
  };
}

export function buildEmptyTimelineCreateDto(
  languages: LanguageRef[],
): TimelineCreateFormDTO {
  return {
    organization: "",
    location: "",
    category: "WORK",
    startDate: "",
    endDate: "",
    current: false,
    images: [],
    translations: buildEmptyTranslationMap(
      languages,
      emptyTimelineTranslationFields,
    ),
  };
}

export function getTimelineTranslationText(
  item: Pick<TimelineEditorDTO, "translations">,
  languages: LanguageRef[],
  localeCode: string,
  field: "title" | "description",
): string {
  const resolver = createLocalizedFieldResolver(languages, localeCode);
  return resolver(item.translations, field);
}
