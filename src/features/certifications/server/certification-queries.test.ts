jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

jest.mock("@/lib/admin/get-authenticated-user-id", () => ({
  requireAuthenticatedUserId: jest.fn(),
}));

jest.mock("@/server/db", () => ({
  db: {
    appLanguage: { findMany: jest.fn() },
    certification: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import { db } from "@/server/db";
import {
  getCertificationCreatePageData,
  getCertificationEditPageData,
  getUserCertificationsWithLanguages,
} from "./certification-queries";

const languages = [{ id: "lang-en", code: "en" }];
const certification = {
  id: "cert-1",
  company: "AWS",
  issuedDate: 2024,
  url: null,
  idCredential: null,
  image: null,
  type: ["BACKEND"],
  userId: "user-1",
  CertificationTranslation: [{ appLanguageId: "lang-en", title: "Architect" }],
  CertificateSkill: [{ skillId: "sk-1" }],
};

describe("certification-queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(requireAuthenticatedUserId).mockResolvedValue("user-1");
    jest.spyOn(db.appLanguage, "findMany").mockResolvedValue(languages as never);
  });

  it("returns an empty create DTO", async () => {
    const result = await getCertificationCreatePageData();
    expect(result.initialData.company).toBe("");
  });

  it("loads and lists certifications", async () => {
    jest
      .spyOn(db.certification, "findUnique")
      .mockResolvedValue(certification as never);
    jest
      .spyOn(db.certification, "findMany")
      .mockResolvedValue([certification] as never);
    jest.spyOn(db.certification, "count").mockResolvedValue(1);

    const editor = await getCertificationEditPageData("cert-1");
    expect(editor.editorDto.company).toBe("AWS");

    const listed = await getUserCertificationsWithLanguages({
      page: 1,
      perPage: 10,
      sort: [{ id: "company", desc: false }],
      filters: [
        {
          id: "title",
          value: "Arch",
          variant: "text",
          operator: "iLike",
          filterId: "f1",
        },
        {
          id: "company",
          value: "AWS",
          variant: "text",
          operator: "iLike",
          filterId: "f2",
        },
      ],
    });
    expect(listed.totalCount).toBe(1);
  });

  it("throws when the certification is missing", async () => {
    jest.spyOn(db.certification, "findUnique").mockResolvedValue(null);
    await expect(getCertificationEditPageData("missing")).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
