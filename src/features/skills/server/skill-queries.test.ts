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
    skill: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import { db } from "@/server/db";
import {
  getSkillCreatePageData,
  getSkillEditPageData,
  getUserSkillsWithLanguages,
} from "./skill-queries";

const languages = [{ id: "lang-en", code: "en" }];
const skill = {
  id: "sk-1",
  title: "React",
  image: "/react.png",
  type: "FRONTEND",
  featured: true,
  userId: "user-1",
  SkillTranslation: [
    {
      appLanguageId: "lang-en",
      description: "UI",
      urlWiki: "",
    },
  ],
  _count: { ProjectSkill: 0, CertificateSkill: 0 },
};

describe("skill-queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(requireAuthenticatedUserId).mockResolvedValue("user-1");
    jest
      .spyOn(db.appLanguage, "findMany")
      .mockResolvedValue(languages as never);
  });

  it("returns an empty create DTO", async () => {
    const result = await getSkillCreatePageData();
    expect(result.initialData.title).toBe("");
    expect(result.languages).toEqual(languages);
  });

  it("loads an editor DTO and lists skills with filters", async () => {
    jest.spyOn(db.skill, "findUnique").mockResolvedValue(skill as never);
    jest.spyOn(db.skill, "findMany").mockResolvedValue([skill] as never);
    jest.spyOn(db.skill, "count").mockResolvedValue(1);

    const editor = await getSkillEditPageData("sk-1");
    expect(editor.editorDto.title).toBe("React");

    const listed = await getUserSkillsWithLanguages({
      page: 1,
      perPage: 10,
      sort: [{ id: "title", desc: false }],
      filters: [
        {
          id: "title",
          value: "Re",
          variant: "text",
          operator: "iLike",
          filterId: "f1",
        },
        {
          id: "type",
          value: "FRONTEND",
          variant: "select",
          operator: "eq",
          filterId: "f2",
        },
      ],
    });
    expect(listed.totalCount).toBe(1);
    expect(listed.data[0]?.title).toBe("React");
  });

  it("throws when the skill is missing", async () => {
    jest.spyOn(db.skill, "findUnique").mockResolvedValue(null);
    await expect(getSkillEditPageData("missing")).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
