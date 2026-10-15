import {
  auditCaseStudyParity,
  buildEmptyCaseStudy,
  caseStudyDtoToWrite,
  caseStudyRowToDto,
  caseStudyUpdatePatch,
  CaseStudyContentSchema,
  isCaseStudyEmpty,
  mergeCaseStudyMap,
  type CaseStudyContentDTO,
} from "./case-study";

const languages = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
];

const decisions = (title: string, why: string) => ({
  key: "decisions",
  kind: "DECISIONS" as const,
  eyebrow: "",
  title: "Decisions",
  lead: "",
  code: "",
  codeLabel: "",
  footnoteTitle: "",
  footnotes: [] as string[],
  footnoteVariant: "default" as const,
  items: [
    {
      key: "tenant-from-host",
      title,
      summary: "",
      body: why,
      value: "",
      icon: "" as const,
      tags: ["Tenant id in a header"],
      note: "Needs HMAC on preview hosts",
    },
  ],
});

const content = (
  overrides: Partial<CaseStudyContentDTO> = {},
): CaseStudyContentDTO => ({
  ...buildEmptyCaseStudy(),
  roleTitle: "Solo architect",
  constraints: ["3 locales", "No CMS"],
  sections: [decisions("Tenant from Host", "Identity cannot be spoofed")],
  ...overrides,
});

describe("CaseStudyContentSchema", () => {
  it("applies defaults so a partial payload is valid", () => {
    const parsed = CaseStudyContentSchema.parse({ roleTitle: "Solo" });
    expect(parsed.sections).toEqual([]);
    expect(parsed.constraints).toEqual([]);
    expect(parsed.context).toBe("");
  });

  it("rejects invalid keys, icons and kinds", () => {
    const base = {
      sections: [{ key: "ok", kind: "CARDS", title: "T", items: [] }],
    };

    expect(CaseStudyContentSchema.safeParse(base).success).toBe(true);
    expect(
      CaseStudyContentSchema.safeParse({
        sections: [{ ...base.sections[0], key: "Not Kebab" }],
      }).success,
    ).toBe(false);
    expect(
      CaseStudyContentSchema.safeParse({
        sections: [{ ...base.sections[0], kind: "VIDEO" }],
      }).success,
    ).toBe(false);
    expect(
      CaseStudyContentSchema.safeParse({
        tldr: [{ key: "a", icon: "rocket" }],
      }).success,
    ).toBe(false);
    expect(
      CaseStudyContentSchema.safeParse({
        sections: [{ ...base.sections[0], title: "  " }],
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate keys among sections and items", () => {
    const dupSections = CaseStudyContentSchema.safeParse({
      sections: [
        { key: "a", kind: "CARDS", title: "A" },
        { key: "a", kind: "STEPS", title: "B" },
      ],
    });
    expect(dupSections.success).toBe(false);

    const dupItems = CaseStudyContentSchema.safeParse({
      sections: [
        {
          key: "a",
          kind: "CARDS",
          title: "A",
          items: [{ key: "x" }, { key: "x" }],
        },
      ],
    });
    expect(dupItems.success).toBe(false);
  });
});

describe("row <-> dto mapping", () => {
  it("turns missing content into an empty editable dto", () => {
    expect(caseStudyRowToDto(null)).toEqual(buildEmptyCaseStudy());
    expect(caseStudyRowToDto(undefined)).toEqual(buildEmptyCaseStudy());
  });

  it("normalizes nulls to empty strings and lists", () => {
    const dto = caseStudyRowToDto({
      roleTitle: null,
      sections: [
        {
          key: "s",
          kind: "TABLE",
          title: "T",
          items: [{ key: "i", title: null, tags: null }],
        },
      ],
    });

    expect(dto.roleTitle).toBe("");
    expect(dto.sections[0]?.items[0]).toMatchObject({
      key: "i",
      title: "",
      tags: [],
      icon: "",
    });
    expect(dto.sections[0]?.footnotes).toEqual([]);
  });

  it("mergeCaseStudyMap returns one entry per language", () => {
    const map = mergeCaseStudyMap(languages, [
      { appLanguageId: "lang-en", caseStudy: { roleTitle: "Solo" } },
    ]);

    expect(Object.keys(map)).toEqual(["en", "es"]);
    expect(map.en?.roleTitle).toBe("Solo");
    expect(isCaseStudyEmpty(map.es)).toBe(true);
  });

  it("returns null for empty content so callers can unset", () => {
    expect(caseStudyDtoToWrite(buildEmptyCaseStudy())).toBeNull();
    expect(caseStudyDtoToWrite(undefined)).toBeNull();
  });

  it("writes empty strings as null and round-trips", () => {
    const dto = content();
    const write = caseStudyDtoToWrite(dto)!;
    const section = Array.isArray(write.sections)
      ? write.sections[0]
      : undefined;
    const item =
      section && Array.isArray(section.items) ? section.items[0] : undefined;

    expect(write.context).toBeNull();
    expect(item?.summary).toBeNull();
    expect(item?.tags).toEqual(["Tenant id in a header"]);
    expect(write.constraints).toEqual(dto.constraints);
    expect(
      caseStudyRowToDto({
        ...dto,
        constraints: dto.constraints,
        sections: dto.sections,
        tldr: dto.tldr,
        responsibilities: dto.responsibilities,
      }),
    ).toEqual(dto);
  });
});

describe("auditCaseStudyParity", () => {
  it("is clean when locales share the same structure", () => {
    const es = content({
      roleTitle: "Arquitecto",
      constraints: ["3 idiomas", "Sin CMS"],
      sections: [
        decisions("Tenant desde el Host", "La identidad no se puede falsear"),
      ],
    });

    expect(auditCaseStudyParity({ en: content(), es }, "en")).toEqual([]);
  });

  it("flags a locale with no case study at all", () => {
    expect(
      auditCaseStudyParity({ en: content(), es: buildEmptyCaseStudy() }, "en"),
    ).toEqual([{ locale: "es", path: "caseStudy", problem: "missing" }]);
  });

  it("flags missing and extra items by key", () => {
    const es = content({
      sections: [
        {
          ...decisions("Tenant desde el Host", "x"),
          items: [
            { ...decisions("Otra", "y").items[0], key: "something-else" },
          ],
        },
      ],
    });
    const issues = auditCaseStudyParity({ en: content(), es }, "en");

    expect(issues).toContainEqual({
      locale: "es",
      path: "sections.decisions.items.tenant-from-host",
      problem: "missing",
    });
    expect(issues).toContainEqual({
      locale: "es",
      path: "sections.decisions.items.something-else",
      problem: "extra",
    });
  });

  it("flags missing constraints, sections and untranslated items", () => {
    const empty = decisions("", "");
    empty.items[0] = { ...empty.items[0], title: "", body: "" };
    const es = content({ constraints: ["3 idiomas"], sections: [empty] });
    const issues = auditCaseStudyParity({ en: content(), es }, "en");

    expect(issues).toContainEqual({
      locale: "es",
      path: "constraints",
      problem: "missing",
    });
    expect(issues).toContainEqual({
      locale: "es",
      path: "sections.decisions.items.tenant-from-host",
      problem: "empty",
    });

    const noSections = auditCaseStudyParity(
      {
        en: content(),
        es: content({ sections: [] }),
      },
      "en",
    );
    expect(noSections).toContainEqual({
      locale: "es",
      path: "sections.decisions",
      problem: "missing",
    });
  });
});

describe("caseStudyUpdatePatch", () => {
  it("leaves stored content untouched for languages not sent", () => {
    expect(caseStudyUpdatePatch({}, "lang-en")).toEqual({});
    expect(caseStudyUpdatePatch({ "lang-es": content() }, "lang-en")).toEqual(
      {},
    );
  });

  it("unsets the field when a sent language is empty", () => {
    expect(
      caseStudyUpdatePatch({ "lang-en": buildEmptyCaseStudy() }, "lang-en"),
    ).toEqual({
      caseStudy: { unset: true },
    });
  });

  it("sets the content when a sent language has data", () => {
    const patch = caseStudyUpdatePatch({ "lang-en": content() }, "lang-en");
    expect(patch).toHaveProperty("caseStudy.set.roleTitle", "Solo architect");
    expect(patch).not.toHaveProperty("caseStudy.unset");
  });
});
