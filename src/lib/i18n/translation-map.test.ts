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

describe("translation-map", () => {
  it("builds empty maps for every configured language", () => {
    expect(
      buildEmptyTranslationMap(languages, { title: "", description: "" }),
    ).toEqual({
      "lang-en": { title: "", description: "" },
      "lang-es": { title: "", description: "" },
    });
  });

  it("merges persisted rows into a complete map", () => {
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

  it("converts between map and row shapes", () => {
    const map = {
      "lang-en": { title: "Hello", description: "World" },
      "lang-es": { title: "Hola", description: "Mundo" },
    };

    expect(translationMapToRows(map, languages)).toEqual([
      { appLanguageId: "lang-en", title: "Hello", description: "World" },
      { appLanguageId: "lang-es", title: "Hola", description: "Mundo" },
    ]);

    expect(translationMapEntries(map)).toEqual([
      { appLanguageId: "lang-en", title: "Hello", description: "World" },
      { appLanguageId: "lang-es", title: "Hola", description: "Mundo" },
    ]);

    expect(
      translationRowsToMap([
        { appLanguageId: "lang-en", title: "Hello", description: "World" },
      ]),
    ).toEqual({
      "lang-en": { title: "Hello", description: "World" },
    });
  });
});
