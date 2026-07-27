import type { PortfolioSoftSkill } from "@prisma/client";
import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  mapSoftSkillToEditorDto,
  mapSoftSkillsToEditorDto,
  buildEmptySoftSkillCreateDto,
  getSoftSkillTranslationText,
} from "./soft-skill-editor-dto";

const languages: LanguageRef[] = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
];

const mockSoftSkill: PortfolioSoftSkill = {
  id: "skill-1",
  icon: "star",
  isVisible: true,
  featured: false,
  order: 1,
  portfolioId: "portfolio-1",
  title: { default: "Teamwork", translations: { es: "Trabajo en equipo" } },
  description: {
    default: "Working well in a team",
    translations: { es: "Trabajar bien en equipo" },
  },
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("mapSoftSkillToEditorDto", () => {
  it("maps a PortfolioSoftSkill to SoftSkillEditorDTO", () => {
    const dto = mapSoftSkillToEditorDto(mockSoftSkill, languages);

    expect(dto.id).toBe("skill-1");
    expect(dto.icon).toBe("star");
    expect(dto.isVisible).toBe(true);
    expect(dto.featured).toBe(false);
    expect(dto.order).toBe(1);
    expect(dto.translations["lang-en"]?.title).toBe("Teamwork");
    expect(dto.translations["lang-es"]?.title).toBe("Trabajo en equipo");
  });
});

describe("mapSoftSkillsToEditorDto", () => {
  it("maps an array of soft skills", () => {
    const result = mapSoftSkillsToEditorDto([mockSoftSkill], languages);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("skill-1");
  });

  it("returns an empty array for empty input", () => {
    expect(mapSoftSkillsToEditorDto([], languages)).toEqual([]);
  });
});

describe("buildEmptySoftSkillCreateDto", () => {
  it("returns a create DTO with empty defaults", () => {
    const dto = buildEmptySoftSkillCreateDto(languages);

    expect(dto.icon).toBe("");
    expect(dto.isVisible).toBe(true);
    expect(dto.featured).toBe(false);
    expect(dto.order).toBe(0);
    expect(dto.translations["lang-en"]).toEqual({ title: "", description: "" });
    expect(dto.translations["lang-es"]).toEqual({ title: "", description: "" });
  });
});

describe("getSoftSkillTranslationText", () => {
  it("retrieves the title for the requested locale", () => {
    const dto = mapSoftSkillToEditorDto(mockSoftSkill, languages);
    const title = getSoftSkillTranslationText(dto, languages, "es", "title");
    expect(title).toBe("Trabajo en equipo");
  });

  it("falls back to English when locale is not found", () => {
    const dto = mapSoftSkillToEditorDto(mockSoftSkill, languages);
    const title = getSoftSkillTranslationText(dto, languages, "nl", "title");
    expect(title).toBe("Teamwork");
  });

  it("retrieves the description field", () => {
    const dto = mapSoftSkillToEditorDto(mockSoftSkill, languages);
    const desc = getSoftSkillTranslationText(
      dto,
      languages,
      "en",
      "description",
    );
    expect(desc).toBe("Working well in a team");
  });
});
