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
});
