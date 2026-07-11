import {
  buildStatusByLangIdFromMap,
  getTranslationCompleteness,
  resolvePrimaryLanguage,
} from "@/lib/i18n/localized-form";

const languages = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
];

describe("resolvePrimaryLanguage", () => {
  it("prefers the configured primary code", () => {
    expect(resolvePrimaryLanguage(languages)?.id).toBe("lang-en");
  });

  it("falls back to the first language", () => {
    expect(resolvePrimaryLanguage([{ id: "lang-nl", code: "nl" }])?.id).toBe(
      "lang-nl",
    );
  });
});

describe("getTranslationCompleteness", () => {
  it("classifies empty, partial, and complete rows", () => {
    expect(
      getTranslationCompleteness({ title: "", description: "" }, [
        "title",
        "description",
      ]),
    ).toBe("empty");

    expect(
      getTranslationCompleteness({ title: "A", description: "" }, [
        "title",
        "description",
      ]),
    ).toBe("partial");

    expect(
      getTranslationCompleteness({ title: "A", description: "B" }, [
        "title",
        "description",
      ]),
    ).toBe("complete");
  });
});

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
});
