import { z } from "zod";
import {
  buildStatusByLangIdFromMap,
  getTranslationCompleteness,
  resolvePrimaryLanguage,
  primaryTranslationMapRequired,
  translationMapSchema,
  titleDescriptionTranslationMapSchema,
  textTranslationMapSchema,
  translationEntriesFromMap,
} from "@/lib/i18n/localized-form";

const languages = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
];

// --- resolvePrimaryLanguage ---

describe("resolvePrimaryLanguage", () => {
  it("prefers the configured primary code", () => {
    expect(resolvePrimaryLanguage(languages)?.id).toBe("lang-en");
  });

  it("falls back to the first language when primary code is not found", () => {
    expect(resolvePrimaryLanguage([{ id: "lang-nl", code: "nl" }])?.id).toBe(
      "lang-nl",
    );
  });

  it("accepts a custom primaryLanguageCode", () => {
    expect(resolvePrimaryLanguage(languages, "es")?.id).toBe("lang-es");
  });

  it("returns undefined for an empty languages array", () => {
    expect(resolvePrimaryLanguage([])).toBeUndefined();
  });
});

// --- getTranslationCompleteness ---

describe("getTranslationCompleteness", () => {
  it("classifies empty entries", () => {
    expect(
      getTranslationCompleteness({ title: "", description: "" }, [
        "title",
        "description",
      ]),
    ).toBe("empty");
  });

  it("classifies partial entries", () => {
    expect(
      getTranslationCompleteness({ title: "A", description: "" }, [
        "title",
        "description",
      ]),
    ).toBe("partial");
  });

  it("classifies complete entries", () => {
    expect(
      getTranslationCompleteness({ title: "A", description: "B" }, [
        "title",
        "description",
      ]),
    ).toBe("complete");
  });

  it("treats whitespace-only strings as empty", () => {
    expect(
      getTranslationCompleteness({ title: "   ", description: "" }, [
        "title",
        "description",
      ]),
    ).toBe("empty");
  });

  it("treats non-string values as empty", () => {
    expect(
      getTranslationCompleteness(
        { title: 123 as unknown as string, description: "" },
        ["title", "description"],
      ),
    ).toBe("empty");
  });
});

// --- buildStatusByLangIdFromMap ---

describe("buildStatusByLangIdFromMap", () => {
  it("maps completeness per language id", () => {
    expect(
      buildStatusByLangIdFromMap(
        languages,
        {
          "lang-en": { title: "A", description: "B" },
          "lang-es": { title: "", description: "" },
        },
        ["title", "description"],
      ),
    ).toEqual({
      "lang-en": "complete",
      "lang-es": "empty",
    });
  });

  it("returns empty for all languages when map is undefined", () => {
    expect(
      buildStatusByLangIdFromMap(languages, undefined, [
        "title",
        "description",
      ]),
    ).toEqual({ "lang-en": "empty", "lang-es": "empty" });
  });

  it("returns empty for a language whose id is missing from the map", () => {
    const result = buildStatusByLangIdFromMap(
      languages,
      { "lang-en": { title: "A", description: "B" } },
      ["title", "description"],
    );
    expect(result["lang-es"]).toBe("empty");
  });
});

// --- primaryTranslationMapRequired ---

describe("primaryTranslationMapRequired", () => {
  const makeCtx = () => {
    const issues: unknown[] = [];
    return {
      addIssue: (issue: unknown) => issues.push(issue),
      get issues() {
        return issues;
      },
    };
  };

  it("does nothing when primaryLangId is undefined", () => {
    const ctx = makeCtx();
    const refine = primaryTranslationMapRequired(
      undefined,
      "title",
      "Required",
    );
    refine(
      { "lang-en": { title: "Hello" } },
      ctx as unknown as import("zod").RefinementCtx,
    );
    expect(ctx.issues).toHaveLength(0);
  });

  it("adds an issue when the field is empty", () => {
    const ctx = makeCtx();
    const refine = primaryTranslationMapRequired(
      "lang-en",
      "title",
      "Title is required",
    );
    refine(
      { "lang-en": { title: "" } },
      ctx as unknown as import("zod").RefinementCtx,
    );
    expect(ctx.issues).toHaveLength(1);
  });

  it("adds an issue when the field is whitespace", () => {
    const ctx = makeCtx();
    const refine = primaryTranslationMapRequired(
      "lang-en",
      "title",
      "Title is required",
    );
    refine(
      { "lang-en": { title: "   " } },
      ctx as unknown as import("zod").RefinementCtx,
    );
    expect(ctx.issues).toHaveLength(1);
  });

  it("does NOT add an issue when the field has content", () => {
    const ctx = makeCtx();
    const refine = primaryTranslationMapRequired(
      "lang-en",
      "title",
      "Required",
    );
    refine(
      { "lang-en": { title: "Hello" } },
      ctx as unknown as import("zod").RefinementCtx,
    );
    expect(ctx.issues).toHaveLength(0);
  });

  it("adds an issue when the primary lang entry is missing entirely", () => {
    const ctx = makeCtx();
    const refine = primaryTranslationMapRequired(
      "lang-en",
      "title",
      "Required",
    );
    refine(
      { "lang-es": { title: "Hola" } },
      ctx as unknown as import("zod").RefinementCtx,
    );
    expect(ctx.issues).toHaveLength(1);
  });
});

// --- translationMapSchema ---

describe("translationMapSchema", () => {
  it("parses a valid map", () => {
    const schema = translationMapSchema(
      z.object({ title: z.string() }),
      "lang-en",
      "title",
      "Title required",
    );
    expect(schema).toBeDefined();
  });
});

describe("titleDescriptionTranslationMapSchema", () => {
  it("validates a complete map correctly", () => {
    const schema = titleDescriptionTranslationMapSchema(
      "lang-en",
      "Title required",
    );
    const result = schema.safeParse({
      "lang-en": { title: "Hello", description: "World" },
    });
    expect(result.success).toBe(true);
  });

  it("fails when primary lang title is empty", () => {
    const schema = titleDescriptionTranslationMapSchema(
      "lang-en",
      "Title required",
    );
    const result = schema.safeParse({
      "lang-en": { title: "", description: "" },
    });
    expect(result.success).toBe(false);
  });

  it("passes when primaryLangId is undefined (no primary validation)", () => {
    const schema = titleDescriptionTranslationMapSchema(
      undefined,
      "Title required",
    );
    const result = schema.safeParse({
      "lang-en": { title: "", description: "" },
    });
    expect(result.success).toBe(true);
  });
});

describe("textTranslationMapSchema", () => {
  it("validates a complete text map", () => {
    const schema = textTranslationMapSchema("lang-en", "Text required");
    const result = schema.safeParse({
      "lang-en": { text: "Hello" },
    });
    expect(result.success).toBe(true);
  });

  it("fails when primary lang text is empty", () => {
    const schema = textTranslationMapSchema("lang-en", "Text required");
    const result = schema.safeParse({
      "lang-en": { text: "" },
    });
    expect(result.success).toBe(false);
  });
});

// --- translationEntriesFromMap ---

describe("translationEntriesFromMap", () => {
  it("converts a TranslationMap into an array of rows", () => {
    const result = translationEntriesFromMap({
      "lang-en": { title: "Hello", description: "World" },
      "lang-es": { title: "Hola", description: "Mundo" },
    });
    expect(result).toEqual(
      expect.arrayContaining([
        { appLanguageId: "lang-en", title: "Hello", description: "World" },
        { appLanguageId: "lang-es", title: "Hola", description: "Mundo" },
      ]),
    );
    expect(result).toHaveLength(2);
  });

  it("returns an empty array for an empty map", () => {
    expect(translationEntriesFromMap({})).toEqual([]);
  });
});
