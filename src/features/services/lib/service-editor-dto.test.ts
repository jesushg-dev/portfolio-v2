import type { Service, ServiceSkill, ServiceTranslation } from "@prisma/client";

import {
  buildEmptyServiceCreateDto,
  mapServiceToEditorDto,
  mapServicesToEditorDto,
} from "./service-editor-dto";

const languages = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
];

const service = {
  id: "sv-1",
  image: "",
  type: "FRONTEND",
  icon: null,
  statsValue: null,
  featured: null,
  isActive: null,
  order: null,
  userId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  ServiceTranslation: [
    {
      id: "t1",
      serviceId: "sv-1",
      appLanguageId: "lang-en",
      title: "Web apps",
      description: "Build UIs",
      badge: "Core",
      statsLabel: null,
    },
  ],
  ServiceSkill: [{ skillId: "sk-1" }],
} as unknown as Service & {
  ServiceTranslation: ServiceTranslation[];
  ServiceSkill: ServiceSkill[];
};

describe("service editor dto", () => {
  it("applies defaults for null fields", () => {
    const dto = mapServiceToEditorDto(service, languages);
    expect(dto.icon).toBe("code");
    expect(dto.isActive).toBe(true);
    expect(dto.order).toBe(0);
    expect(dto.skillIds).toEqual(["sk-1"]);
    expect(dto.translations["lang-en"]?.title).toBe("Web apps");
  });

  it("maps a list and empty create dto", () => {
    expect(mapServicesToEditorDto([service], languages)).toHaveLength(1);
    expect(buildEmptyServiceCreateDto(languages).type).toBe("FRONTEND");
  });
});
