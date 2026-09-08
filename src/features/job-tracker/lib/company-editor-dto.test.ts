import type { Company } from "@prisma/client";

import {
  buildEmptyCompanyCreateDto,
  mapCompaniesToEditorDto,
  mapCompanyToEditorDto,
} from "./company-editor-dto";

const company = {
  id: "co-1",
  name: "Acme",
  email: null,
  website: null,
  description: null,
  userId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
} as Company;

describe("company editor dto", () => {
  it("coerces nulls to empty strings", () => {
    expect(mapCompanyToEditorDto(company)).toEqual({
      id: "co-1",
      name: "Acme",
      email: "",
      website: "",
      description: "",
    });
  });

  it("maps a list", () => {
    expect(mapCompaniesToEditorDto([company])).toHaveLength(1);
  });

  it("builds an empty create dto", () => {
    expect(buildEmptyCompanyCreateDto().name).toBe("");
  });
});
