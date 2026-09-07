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
    service: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import { db } from "@/server/db";
import {
  getServiceCreatePageData,
  getServiceEditPageData,
  getUserServicesWithLanguages,
} from "./service-queries";

const languages = [{ id: "lang-en", code: "en" }];
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
  ServiceTranslation: [
    {
      appLanguageId: "lang-en",
      title: "Web apps",
      description: "Build UIs",
      badge: "Core",
      statsLabel: null,
    },
  ],
  ServiceSkill: [{ skillId: "sk-1" }],
};

describe("service-queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(requireAuthenticatedUserId).mockResolvedValue("user-1");
    jest.mocked(db.appLanguage.findMany).mockResolvedValue(languages as never);
  });

  it("returns an empty create DTO", async () => {
    const result = await getServiceCreatePageData();
    expect(result.initialData.type).toBeDefined();
  });

  it("loads and lists services", async () => {
    jest.mocked(db.service.findUnique).mockResolvedValue(service as never);
    jest.mocked(db.service.findMany).mockResolvedValue([service] as never);
    jest.mocked(db.service.count).mockResolvedValue(1);

    const editor = await getServiceEditPageData("sv-1");
    expect(editor.editorDto.translations["lang-en"]?.title).toBe("Web apps");

    const listed = await getUserServicesWithLanguages({
      page: 1,
      perPage: 10,
      sort: [{ id: "type", desc: true }],
      filters: [
        {
          id: "title",
          value: "Web",
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
  });

  it("throws when the service is missing", async () => {
    jest.mocked(db.service.findUnique).mockResolvedValue(null);
    await expect(getServiceEditPageData("missing")).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
