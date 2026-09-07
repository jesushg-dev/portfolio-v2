import type { Project, ProjectSkill, ProjectTranslation } from "@prisma/client";

import {
  buildEmptyProjectCreateDto,
  mapProjectToEditorDto,
  mapProjectsToEditorDto,
} from "./project-editor-dto";

const languages = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
];

const project = {
  id: "pr-1",
  image: "https://cdn.example/p.png",
  type: "FRONTEND",
  githubUrl: null,
  websiteUrl: null,
  isPrivate: false,
  order: null,
  kind: null,
  slug: null,
  caseStudyEnabled: null,
  userId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  ProjectTranslation: [
    {
      appLanguageId: "lang-en",
      title: "Eleven",
      description: "App",
      hook: null,
      challenge: null,
      approach: null,
      outcome: null,
    },
  ],
  ProjectSkill: [{ skillId: "sk-1" }],
} as unknown as Project & {
  ProjectTranslation: ProjectTranslation[];
  ProjectSkill: ProjectSkill[];
};

describe("project editor dto", () => {
  it("maps defaults for null fields", () => {
    const dto = mapProjectToEditorDto(project, languages);
    expect(dto.kind).toBe("PERSONAL");
    expect(dto.slug).toBe("");
    expect(dto.skillIds).toEqual(["sk-1"]);
    expect(dto.translations["lang-en"]?.title).toBe("Eleven");
    expect(mapProjectsToEditorDto([project], languages)).toHaveLength(1);
    expect(buildEmptyProjectCreateDto(languages).type).toBe("FRONTEND");
  });
});
