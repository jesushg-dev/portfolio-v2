import {
  buildEmptySkillCreateDto,
  mapSkillToEditorDto,
  mapSkillToPickerRow,
  mapSkillsToEditorDto,
  type SkillWithRelations,
} from "./skill-editor-dto";

const languages = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
];

const skill = {
  id: "sk-1",
  title: "React",
  image: "/react.png",
  type: "FRONTEND",
  featured: true,
  userId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  SkillTranslation: [
    {
      id: "t1",
      skillId: "sk-1",
      appLanguageId: "lang-en",
      description: "UI library",
      urlWiki: "https://react.dev",
      createdAt: new Date(),
    },
  ],
  _count: { ProjectSkill: 2, CertificateSkill: 1 },
} as unknown as SkillWithRelations;

describe("skill editor dto", () => {
  it("maps translations and counts", () => {
    const dto = mapSkillToEditorDto(skill, languages);
    expect(dto.title).toBe("React");
    expect(dto.translations["lang-en"]?.description).toBe("UI library");
    expect(dto.translations["lang-es"]?.description).toBe("");
    expect(dto.projectCount).toBe(2);
    expect(dto.certificateCount).toBe(1);
  });

  it("maps a list and picker row", () => {
    const [dto] = mapSkillsToEditorDto([skill], languages);
    expect(mapSkillToPickerRow(dto)).toEqual({
      id: "sk-1",
      title: "React",
      image: "/react.png",
      type: "FRONTEND",
    });
  });

  it("builds an empty create dto", () => {
    const dto = buildEmptySkillCreateDto(languages);
    expect(dto.type).toBe("FRONTEND");
    expect(dto.translations["lang-en"]).toEqual({
      description: "",
      urlWiki: "",
    });
  });
});
