import type {
  UsesClarification,
  UsesClarificationTranslation,
  UsesItem,
  UsesItemTranslation,
  UsesItemType,
  UsesSettings,
  UsesSettingsTranslation,
  UsesWorkspaceTag,
} from "@prisma/client";

import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  type TranslationMap,
  buildEmptyTranslationMap,
  mergeTranslationMap,
} from "@/lib/i18n/translation-map";

export interface UsesItemTranslationFields {
  title: string;
  description: string;
}

export type UsesItemTranslationMap = TranslationMap<UsesItemTranslationFields>;

export interface UsesItemEditorDTO {
  id: string;
  type: UsesItemType;
  href: string;
  image: string;
  order: number;
  translations: UsesItemTranslationMap;
}

export type UsesItemCreateFormDTO = Omit<UsesItemEditorDTO, "id">;

export interface UsesSettingsTranslationFields {
  codingIntro: string;
  browserIntro: string;
}

export type UsesSettingsTranslationMap =
  TranslationMap<UsesSettingsTranslationFields>;

export interface UsesClarificationTranslationFields {
  body: string;
}

export type UsesClarificationTranslationMap =
  TranslationMap<UsesClarificationTranslationFields>;

export interface UsesClarificationEditorDTO {
  id: string;
  order: number;
  translations: UsesClarificationTranslationMap;
}

export interface UsesWorkspaceTagEditorDTO {
  id: string;
  usesItemId: string;
  xPercent: number;
  yPercent: number;
  order: number;
}

export interface UsesSettingsEditorDTO {
  id: string;
  workspaceImage: string;
  codingPreviewLight: string;
  codingPreviewDark: string;
  translations: UsesSettingsTranslationMap;
  clarifications: UsesClarificationEditorDTO[];
  workspaceTags: UsesWorkspaceTagEditorDTO[];
}

const emptyItemTranslationFields: UsesItemTranslationFields = {
  title: "",
  description: "",
};

const emptySettingsTranslationFields: UsesSettingsTranslationFields = {
  codingIntro: "",
  browserIntro: "",
};

const emptyClarificationTranslationFields: UsesClarificationTranslationFields =
  {
    body: "",
  };

type UsesItemWithRelations = UsesItem & {
  UsesItemTranslation: UsesItemTranslation[];
};

type UsesSettingsWithRelations = UsesSettings & {
  UsesSettingsTranslation: UsesSettingsTranslation[];
  UsesClarification: (UsesClarification & {
    UsesClarificationTranslation: UsesClarificationTranslation[];
  })[];
  UsesWorkspaceTag: UsesWorkspaceTag[];
};

export function mapUsesItemToEditorDto(
  item: UsesItemWithRelations,
  languages: LanguageRef[],
): UsesItemEditorDTO {
  const rows =
    item.UsesItemTranslation?.map((translation) => ({
      appLanguageId: translation.appLanguageId,
      title: translation.title ?? "",
      description: translation.description ?? "",
    })) ?? [];

  return {
    id: item.id,
    type: item.type,
    href: item.href ?? "",
    image: item.image ?? "",
    order: item.order,
    translations: mergeTranslationMap(
      languages,
      rows,
      emptyItemTranslationFields,
    ),
  };
}

export function mapUsesItemsToEditorDto(
  items: UsesItemWithRelations[],
  languages: LanguageRef[],
): UsesItemEditorDTO[] {
  return items.map((item) => mapUsesItemToEditorDto(item, languages));
}

export function buildEmptyUsesItemCreateDto(
  languages: LanguageRef[],
  type: UsesItemType = "EVERYDAY",
): UsesItemCreateFormDTO {
  return {
    type,
    href: "",
    image: "",
    order: 0,
    translations: buildEmptyTranslationMap(
      languages,
      emptyItemTranslationFields,
    ),
  };
}

export function mapUsesSettingsToEditorDto(
  settings: UsesSettingsWithRelations,
  languages: LanguageRef[],
): UsesSettingsEditorDTO {
  const translationRows =
    settings.UsesSettingsTranslation?.map((translation) => ({
      appLanguageId: translation.appLanguageId,
      codingIntro: translation.codingIntro ?? "",
      browserIntro: translation.browserIntro ?? "",
    })) ?? [];

  const clarifications = (settings.UsesClarification ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((clarification) => {
      const rows =
        clarification.UsesClarificationTranslation?.map((translation) => ({
          appLanguageId: translation.appLanguageId,
          body: translation.body ?? "",
        })) ?? [];

      return {
        id: clarification.id,
        order: clarification.order,
        translations: mergeTranslationMap(
          languages,
          rows,
          emptyClarificationTranslationFields,
        ),
      };
    });

  const workspaceTags = (settings.UsesWorkspaceTag ?? [])
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((tag) => ({
      id: tag.id,
      usesItemId: tag.usesItemId,
      xPercent: tag.xPercent,
      yPercent: tag.yPercent,
      order: tag.order,
    }));

  return {
    id: settings.id,
    workspaceImage: settings.workspaceImage ?? "",
    codingPreviewLight: settings.codingPreviewLight ?? "",
    codingPreviewDark: settings.codingPreviewDark ?? "",
    translations: mergeTranslationMap(
      languages,
      translationRows,
      emptySettingsTranslationFields,
    ),
    clarifications,
    workspaceTags,
  };
}

export function buildEmptyUsesClarificationDto(
  languages: LanguageRef[],
  order = 0,
): Omit<UsesClarificationEditorDTO, "id"> {
  return {
    order,
    translations: buildEmptyTranslationMap(
      languages,
      emptyClarificationTranslationFields,
    ),
  };
}

export function usesItemEditorTitle(
  item: Pick<UsesItemEditorDTO, "translations">,
  langId: string,
): string {
  const preferred = item.translations[langId]?.title?.trim();
  if (preferred) return preferred;
  for (const fields of Object.values(item.translations)) {
    const title = fields?.title?.trim();
    if (title) return title;
  }
  return "";
}
