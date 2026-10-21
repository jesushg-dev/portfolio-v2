import type {
  UsesItem,
  UsesItemTranslation,
  UsesSettings,
  UsesSettingsTranslation,
  UsesClarification,
  UsesClarificationTranslation,
  UsesWorkspaceTag,
} from "@prisma/client";

import {
  buildEmptyUsesClarificationDto,
  buildEmptyUsesItemCreateDto,
  mapUsesItemToEditorDto,
  mapUsesItemsToEditorDto,
  mapUsesSettingsToEditorDto,
  usesItemEditorTitle,
} from "./uses-editor-dto";

const languages = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
];

const item = {
  id: "item-1",
  type: "EVERYDAY",
  href: null,
  image: null,
  order: 2,
  userId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  UsesItemTranslation: [
    {
      appLanguageId: "lang-es",
      title: "Teclado",
      description: "Mecánico",
    },
  ],
} as unknown as UsesItem & { UsesItemTranslation: UsesItemTranslation[] };

const settings = {
  id: "set-1",
  workspaceImage: null,
  codingPreviewLight: "light.png",
  codingPreviewDark: "dark.png",
  userId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  UsesSettingsTranslation: [],
  UsesClarification: [
    {
      id: "c1",
      order: 1,
      UsesClarificationTranslation: [
        { appLanguageId: "lang-en", body: "Note" },
      ],
    },
  ],
  UsesWorkspaceTag: [
    {
      id: "tag-1",
      usesItemId: "item-1",
      xPercent: 10,
      yPercent: 20,
      order: 0,
    },
  ],
} as unknown as UsesSettings & {
  UsesSettingsTranslation: UsesSettingsTranslation[];
  UsesClarification: (UsesClarification & {
    UsesClarificationTranslation: UsesClarificationTranslation[];
  })[];
  UsesWorkspaceTag: UsesWorkspaceTag[];
};

describe("uses editor dto", () => {
  it("maps items and falls back to any title", () => {
    const dto = mapUsesItemToEditorDto(item, languages);
    expect(dto.href).toBe("");
    expect(usesItemEditorTitle(dto, "lang-en")).toBe("Teclado");
    expect(mapUsesItemsToEditorDto([item], languages)).toHaveLength(1);
  });

  it("maps settings with sorted clarifications and tags", () => {
    const dto = mapUsesSettingsToEditorDto(settings, languages);
    expect(dto.clarifications[0]?.translations["lang-en"]?.body).toBe("Note");
    expect(dto.workspaceTags[0]?.xPercent).toBe(10);
    expect(buildEmptyUsesItemCreateDto(languages).type).toBe("EVERYDAY");
    expect(buildEmptyUsesClarificationDto(languages, 3).order).toBe(3);
  });
});
