import {
  getRowTextForLocale,
  getTitleDescriptionForLocale,
  createLocalizedFieldResolver,
} from "./localized-display";
import type { LanguageRef } from "@/lib/i18n/editor-rows";

const languages: LanguageRef[] = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
  { id: "lang-nl", code: "nl" },
];

// --- getRowTextForLocale ---

describe("getRowTextForLocale (array input)", () => {
  it("returns the text for the requested locale", () => {
    const rows = [
      { appLanguageId: "lang-en", text: "Hello" },
      { appLanguageId: "lang-es", text: "Hola" },
    ];
    expect(getRowTextForLocale(rows, languages, "es")).toBe("Hola");
  });

  it("falls back to English when locale text is empty", () => {
    const rows = [
      { appLanguageId: "lang-en", text: "Fallback" },
      { appLanguageId: "lang-es", text: "" },
    ];
    expect(getRowTextForLocale(rows, languages, "es")).toBe("Fallback");
  });

  it("falls back to first non-empty translation when English is also empty", () => {
    const rows = [
      { appLanguageId: "lang-en", text: "" },
      { appLanguageId: "lang-nl", text: "Dutch text" },
    ];
    expect(getRowTextForLocale(rows, languages, "es")).toBe("Dutch text");
  });

  it("returns empty string when all translations are empty", () => {
    const rows = [
      { appLanguageId: "lang-en", text: "" },
      { appLanguageId: "lang-es", text: "" },
    ];
    expect(getRowTextForLocale(rows, languages, "es")).toBe("");
  });

  it("returns empty string when languages list is empty", () => {
    const rows = [{ appLanguageId: "lang-en", text: "Hello" }];
    expect(getRowTextForLocale(rows, [], "en")).toBe("");
  });
});

describe("getRowTextForLocale (map input)", () => {
  it("accepts a TranslationMap<{ text }> object", () => {
    const map = {
      "lang-en": { text: "Map Hello" },
      "lang-es": { text: "Map Hola" },
    };
    expect(getRowTextForLocale(map, languages, "es")).toBe("Map Hola");
  });
});

// --- createLocalizedFieldResolver (direct call) ---

describe("createLocalizedFieldResolver (direct call)", () => {
  const translations = [
    { appLanguageId: "lang-en", title: "Title EN", description: "Desc EN" },
    { appLanguageId: "lang-es", title: "Título ES", description: "Desc ES" },
  ];

  it("returns the correct field for the requested locale", () => {
    const resolve = createLocalizedFieldResolver(languages, "es");
    expect(resolve(translations, "title")).toBe("Título ES");
    expect(resolve(translations, "description")).toBe("Desc ES");
  });

  it("falls back to English when locale field is empty", () => {
    const rows = [
      {
        appLanguageId: "lang-en",
        title: "English fallback",
        description: "EN desc",
      },
      { appLanguageId: "lang-es", title: "", description: "" },
    ];
    const resolve = createLocalizedFieldResolver(languages, "es");
    expect(resolve(rows, "title")).toBe("English fallback");
  });

  it("returns empty string when no language is found", () => {
    const resolve = createLocalizedFieldResolver([], "en");
    expect(resolve(translations, "title")).toBe("");
  });

  it("falls back to first non-empty when locale and English are both empty", () => {
    const rows = [
      { appLanguageId: "lang-en", title: "", description: "" },
      {
        appLanguageId: "lang-nl",
        title: "Dutch title",
        description: "NL desc",
      },
    ];
    const resolve = createLocalizedFieldResolver(languages, "es");
    expect(resolve(rows, "title")).toBe("Dutch title");
  });

  it("returns empty string when all fields are empty", () => {
    const rows = [
      { appLanguageId: "lang-en", title: "", description: "" },
      { appLanguageId: "lang-es", title: "", description: "" },
    ];
    const resolve = createLocalizedFieldResolver(languages, "es");
    expect(resolve(rows, "title")).toBe("");
  });

  it("accepts a TranslationMap input", () => {
    const map = {
      "lang-en": { title: "Map EN", description: "Desc EN" },
      "lang-es": { title: "Map ES", description: "Desc ES" },
    };
    const resolve = createLocalizedFieldResolver(languages, "en");
    expect(resolve(map, "title")).toBe("Map EN");
  });
});

// --- getTitleDescriptionForLocale ---

describe("getTitleDescriptionForLocale", () => {
  const translations = [
    { appLanguageId: "lang-en", title: "Hello", description: "World" },
    { appLanguageId: "lang-es", title: "Hola", description: "Mundo" },
  ];

  it("returns title for the requested locale", () => {
    expect(
      getTitleDescriptionForLocale(translations, languages, "es", "title"),
    ).toBe("Hola");
  });

  it("returns description for the requested locale", () => {
    expect(
      getTitleDescriptionForLocale(
        translations,
        languages,
        "en",
        "description",
      ),
    ).toBe("World");
  });

  it("falls back to English for missing locale", () => {
    expect(
      getTitleDescriptionForLocale(translations, languages, "nl", "title"),
    ).toBe("Hello");
  });

  it("falls back to languages[0] when en code is missing in languages array", () => {
    const nonEnLanguages: LanguageRef[] = [
      { id: "lang-fr", code: "fr" },
      { id: "lang-es", code: "es" },
    ];
    const rows = [
      { appLanguageId: "lang-fr", text: "Bonjour" },
      { appLanguageId: "lang-es", text: "" },
    ];
    // Requesting "es" (empty) -> primary language falls back to languages[0] ("fr") -> returns "Bonjour"
    expect(getRowTextForLocale(rows, nonEnLanguages, "es")).toBe("Bonjour");

    const fieldRows = [
      { appLanguageId: "lang-fr", title: "Titre FR", description: "Desc FR" },
      { appLanguageId: "lang-es", title: "", description: "" },
    ];
    expect(
      createLocalizedFieldResolver(nonEnLanguages, "es")(fieldRows, "title"),
    ).toBe("Titre FR");
  });
});

describe("createLocalizedFieldResolver", () => {
  const translations = [
    { appLanguageId: "lang-en", role: "Engineer", location: "Madrid" },
    { appLanguageId: "lang-es", role: "Ingeniero", location: "Madrid" },
  ];

  it("resolves with bound languages + locale", () => {
    const field = createLocalizedFieldResolver(languages, "es");
    expect(field(translations, "role")).toBe("Ingeniero");
  });

  it("supports flat t(field) via .for(translations)", () => {
    const field = createLocalizedFieldResolver(languages, "es");
    const t = field.for(translations);
    expect(t("role")).toBe("Ingeniero");
    expect(t("location")).toBe("Madrid");
  });

  it("infers TranslationMap field keys", () => {
    const field = createLocalizedFieldResolver(languages, "en");
    const map = {
      "lang-en": { title: "Hello", description: "World" },
      "lang-es": { title: "Hola", description: "Mundo" },
    };
    const t = field.for(map);
    expect(t("title")).toBe("Hello");
    expect(t("description")).toBe("World");
  });

  it("falls back to English when locale field is empty", () => {
    const field = createLocalizedFieldResolver(languages, "nl");
    const t = field.for([
      { appLanguageId: "lang-en", role: "Engineer" },
      { appLanguageId: "lang-nl", role: "" },
    ]);
    expect(t("role")).toBe("Engineer");
  });
});
