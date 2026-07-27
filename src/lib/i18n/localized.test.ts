import { buildLocalizedText, getLocalizedText } from "./localized";

describe("getLocalizedText", () => {
  it("returns plain strings as-is", () => {
    expect(getLocalizedText("Hello", "en")).toBe("Hello");
  });

  it("returns the translation for the requested locale", () => {
    expect(
      getLocalizedText(
        { default: "Hello", translations: { es: "Hola" } },
        "es",
      ),
    ).toBe("Hola");
  });

  it("falls back to defaultLocale when locale translation is missing", () => {
    expect(
      getLocalizedText(
        { default: "Hello", translations: { en: "Hello" } },
        "es",
        "en",
      ),
    ).toBe("Hello");
  });

  it("does NOT attempt defaultLocale fallback when defaultLocale === locale", () => {
    // Covers line 57: `defaultLocale && defaultLocale !== locale` is false
    expect(
      getLocalizedText(
        { default: "Fallback", translations: {} },
        "en",
        "en", // same as locale → skip the fallback branch
      ),
    ).toBe("Fallback");
  });

  it("falls back to default when no translation matches", () => {
    expect(getLocalizedText({ default: "Hello", translations: {} }, "nl")).toBe(
      "Hello",
    );
  });

  it("returns empty string for invalid values", () => {
    expect(getLocalizedText(null, "en")).toBe("");
    expect(getLocalizedText(undefined, "en")).toBe("");
    expect(getLocalizedText(42, "en")).toBe("");
  });

  it("returns empty string when value is an empty object with no default", () => {
    expect(getLocalizedText({}, "en")).toBe("");
  });

  it("returns translation even when it contains only whitespace (trimmed check is in caller)", () => {
    // getLocalizedText itself doesn't trim; it checks translation?.trim() truthy
    expect(
      getLocalizedText(
        { default: "Default", translations: { es: "  " } },
        "es",
      ),
    ).toBe("Default");
  });
});

describe("buildLocalizedText", () => {
  it("builds localized text with default and translations", () => {
    expect(
      buildLocalizedText({ en: "Hello", es: "Hola", nl: "Hallo" }, "en"),
    ).toEqual({
      default: "Hello",
      translations: { es: "Hola", nl: "Hallo" },
    });
  });

  it("throws when default locale value is missing", () => {
    expect(() => buildLocalizedText({ es: "Hola" }, "en")).toThrow(
      'Default locale "en" is missing in values',
    );
  });

  it("omits translations key when no other locales are provided (covers line 84)", () => {
    // Only the default locale → translations object is empty → omitted
    const result = buildLocalizedText({ en: "Hello" }, "en");
    expect(result).toEqual({ default: "Hello" });
    expect(result.translations).toBeUndefined();
  });

  it("omits empty locale values from translations", () => {
    const result = buildLocalizedText({ en: "Hello", es: "" }, "en");
    expect(result.translations).toBeUndefined();
  });

  it("uses es as the default locale and puts en in translations", () => {
    const result = buildLocalizedText({ en: "Hello", es: "Hola" }, "es");
    expect(result.default).toBe("Hola");
    expect(result.translations?.en).toBe("Hello");
  });
});
