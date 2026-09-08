import type {
  NowFocus,
  NowFocusTranslation,
  NowSettings,
  NowSettingsTranslation,
} from "@prisma/client";

import {
  buildEmptyNowFocusCreateDto,
  buildEmptyNowSettingsDto,
  mapNowFocusesToEditorDto,
  mapNowFocusToEditorDto,
  mapNowSettingsToEditorDto,
} from "./now-editor-dto";

const languages = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
];

const settings = {
  id: "now-1",
  timezone: "UTC",
  githubUsername: null,
  statusEmoji: null,
  readingTitle: null,
  readingAuthors: null,
  readingProgress: null,
  watchedTitle: null,
  watchedRating: null,
  githubRepo: null,
  githubHref: null,
  photoUrls: null,
  userId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  NowSettingsTranslation: [
    {
      appLanguageId: "lang-en",
      statusBody: "Shipping",
      statusRelative: "this week",
      githubBody: "Open source",
      githubRelative: "today",
    },
  ],
} as unknown as NowSettings & {
  NowSettingsTranslation: NowSettingsTranslation[];
};

const focus = {
  id: "focus-1",
  order: 1,
  userId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  NowFocusTranslation: [
    { appLanguageId: "lang-en", label: "Focus", body: "Docs" },
  ],
} as unknown as NowFocus & { NowFocusTranslation: NowFocusTranslation[] };

describe("now editor dto", () => {
  it("maps settings with defaults", () => {
    const dto = mapNowSettingsToEditorDto(settings, languages);
    expect(dto.statusEmoji).toBe("🚀");
    expect(dto.githubUsername).toBe("");
    expect(dto.translations["lang-en"]?.statusBody).toBe("Shipping");
  });

  it("maps focuses and empty dtos", () => {
    expect(mapNowFocusToEditorDto(focus, languages).order).toBe(1);
    expect(mapNowFocusesToEditorDto([focus], languages)).toHaveLength(1);
    expect(buildEmptyNowSettingsDto(languages).timezone).toBe(
      "America/Mexico_City",
    );
    expect(buildEmptyNowFocusCreateDto(languages).order).toBe(0);
  });
});
