import type {
  Certification,
  CertificationTranslation,
  CertificateSkill,
} from "@prisma/client";

import {
  mapCertificationToEditorDto,
  mapCertificationsToEditorDto,
} from "./certification-editor-dto";

const languages = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
];

const certification = {
  id: "cert-1",
  company: "AWS",
  issuedDate: 2024,
  url: null,
  idCredential: null,
  image: null,
  type: ["BACKEND"],
  userId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  CertificationTranslation: [{ appLanguageId: "lang-en", title: "Architect" }],
  CertificateSkill: [{ skillId: "sk-1" }],
} as unknown as Certification & {
  CertificationTranslation: CertificationTranslation[];
  CertificateSkill: CertificateSkill[];
};

describe("certification editor dto", () => {
  it("maps nulls to empty strings", () => {
    const dto = mapCertificationToEditorDto(certification, languages);
    expect(dto.url).toBe("");
    expect(dto.skillIds).toEqual(["sk-1"]);
    expect(dto.translations["lang-en"]?.title).toBe("Architect");
    expect(
      mapCertificationsToEditorDto([certification], languages),
    ).toHaveLength(1);
  });
});
