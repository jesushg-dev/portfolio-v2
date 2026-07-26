import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  buildEmptyTranslationMap,
  mergeTranslationMap,
  translationMapEntries,
  translationMapToRows,
  translationRowsToMap,
} from "@/lib/i18n/translation-map";

const languages: LanguageRef[] = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
];

describe("buildEmptyTranslationMap", () => {
  it("builds empty maps for every configured language", () => {
    expect(
      buildEmptyTranslationMap(languages, { title: "", description: "" }),
    ).toEqual({
      "lang-en": { title: "", description: "" },
      "lang-es": { title: "", description: "" },
    });
  });

  it("returns an empty object when languages is empty", () => {
    expect(buildEmptyTranslationMap([], { title: "" })).toEqual({});
  });
});

describe("mergeTranslationMap", () => {
  it("merges persisted rows (array) into a complete map", () => {
    expect(
      mergeTranslationMap(
        languages,
        [{ appLanguageId: "lang-en", title: "Teamwork", description: "A" }],
        { title: "", description: "" },
      ),
    ).toEqual({
      "lang-en": { title: "Teamwork", description: "A" },
      "lang-es": { title: "", description: "" },
    });
  });

  it("merges a TranslationMap object (not an array)", () => {
    const source = {
      "lang-en": { title: "Hello", description: "World" },
    };
    const result = mergeTranslationMap(languages, source, { title: "", description: "" });
    expect(result["lang-en"]).toEqual({ title: "Hello", description: "World" });
    expect(result["lang-es"]).toEqual({ title: "", description: "" });
  });

  it("fills all with empty fields when source is null", () => {
    const result = mergeTranslationMap(languages, null, { title: "", description: "" });
    expect(result).toEqual({
      "lang-en": { title: "", description: "" },
      "lang-es": { title: "", description: "" },
    });
  });

  it("fills all with empty fields when source is undefined", () => {
    const result = mergeTranslationMap(languages, undefined, { title: "", description: "" });
    expect(result).toEqual({
      "lang-en": { title: "", description: "" },
      "lang-es": { title: "", description: "" },
    });
  });
});

describe("translationMapToRows", () => {
  it("converts a TranslationMap to an ordered array of rows", () => {
    const map = {
      "lang-en": { title: "Hello", description: "World" },
      "lang-es": { title: "Hola", description: "Mundo" },
    };

    expect(translationMapToRows(map, languages)).toEqual([
      { appLanguageId: "lang-en", title: "Hello", description: "World" },
      { appLanguageId: "lang-es", title: "Hola", description: "Mundo" },
    ]);
  });

  it("uses empty object when a language id is missing from the map", () => {
    // "lang-es" is not in the map — should use {} as T
    const map = {
      "lang-en": { title: "Hello", description: "World" },
    };
    const rows = translationMapToRows(map, languages);
    expect(rows[1]).toEqual({ appLanguageId: "lang-es" });
  });
});

describe("translationMapEntries", () => {
  it("converts a map to an array of rows including appLanguageId", () => {
    const map = {
      "lang-en": { title: "Hello", description: "World" },
      "lang-es": { title: "Hola", description: "Mundo" },
    };

    expect(translationMapEntries(map)).toEqual(
      expect.arrayContaining([
        { appLanguageId: "lang-en", title: "Hello", description: "World" },
        { appLanguageId: "lang-es", title: "Hola", description: "Mundo" },
      ]),
    );
  });

  it("returns an empty array for an empty map", () => {
    expect(translationMapEntries({})).toEqual([]);
  });
});

describe("translationRowsToMap", () => {
  it("converts an array of rows to a map keyed by appLanguageId", () => {
    expect(
      translationRowsToMap([
        { appLanguageId: "lang-en", title: "Hello", description: "World" },
      ]),
    ).toEqual({
      "lang-en": { title: "Hello", description: "World" },
    });
  });

  it("returns empty map for empty input", () => {
    expect(translationRowsToMap([])).toEqual({});
  });
});

