import {
  isLocale,
  localizedFromLanguageMap,
  languageMapFromLocalized,
} from "./localized-json";

describe("isLocale", () => {
  it("returns true for valid locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("es")).toBe(true);
  });

  it("returns false for invalid locales", () => {
    expect(isLocale("xx")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale("zh")).toBe(false);
  });
});

describe("localizedFromLanguageMap", () => {
  it("returns just default when only primary is present", () => {
    const result = localizedFromLanguageMap({ en: "Hello" }, "en");
    expect(result).toEqual({ default: "Hello" });
  });

  it("includes translations when other languages are present", () => {
    const result = localizedFromLanguageMap({ en: "Hello", es: "Hola" }, "en");
    expect(result).toEqual({ default: "Hello", translations: { es: "Hola" } });
  });

  it("omits empty translations", () => {
    const result = localizedFromLanguageMap({ en: "Hi", es: "" }, "en");
    expect(result).toEqual({ default: "Hi" });
  });

  it("omits whitespace-only translations", () => {
    const result = localizedFromLanguageMap({ en: "Hi", es: "   " }, "en");
    expect(result).toEqual({ default: "Hi" });
  });

  it("returns empty default when primary code is missing", () => {
    const result = localizedFromLanguageMap({ es: "Hola" }, "en");
    expect(result.default).toBe("");
    expect(result.translations).toEqual({ es: "Hola" });
  });

  it("trims whitespace from the default value", () => {
    const result = localizedFromLanguageMap({ en: "  Hello  " }, "en");
    expect(result.default).toBe("Hello");
  });
});

describe("languageMapFromLocalized", () => {
  it("returns text keyed by code using getLocalizedText", () => {
    const value = { default: "Hello", translations: { es: "Hola" } };
    const result = languageMapFromLocalized(value, ["en", "es"]);
    expect(result.en).toBe("Hello");
    expect(result.es).toBe("Hola");
  });

  it("handles plain string values", () => {
    const result = languageMapFromLocalized("Texto", ["en", "es"]);
    // getLocalizedText returns the string as-is for a plain string
    expect(result.en).toBe("Texto");
    expect(result.es).toBe("Texto");
  });

  it("returns empty string for null/undefined value", () => {
    const result = languageMapFromLocalized(null, ["en"]);
    expect(result.en).toBe("");
  });

  it("falls back to primary locale for unknown locales (treated as en)", () => {
    const value = { default: "Hello" };
    // "nl" is a valid locale; no translation => falls back to default
    const result = languageMapFromLocalized(value, ["nl"]);
    expect(result.nl).toBe("Hello");
  });
});
