import {
  languageMapToTextMap,
  localizedJsonToTextMap,
  optionalTextMapToLocalizedJson,
  textMapToLocalizedJson,
} from "./localized-text-map";
import type { LanguageRef } from "./editor-rows";

const languages: LanguageRef[] = [
  { id: "lang-en", code: "en", isDefault: true },
  { id: "lang-es", code: "es", isDefault: false },
];

describe("localized-text-map", () => {
  describe("localizedJsonToTextMap", () => {
    it("converts LocalizedText object into a TextTranslationMap", () => {
      const json = {
        default: "Hello",
        translations: { es: "Hola" },
      };
      const res = localizedJsonToTextMap(json, languages);
      expect(res["lang-en"]).toEqual({ text: "Hello" });
      expect(res["lang-es"]).toEqual({ text: "Hola" });
    });

    it("handles null or invalid input gracefully", () => {
      const res = localizedJsonToTextMap(null, languages);
      expect(res["lang-en"]).toEqual({ text: "" });
      expect(res["lang-es"]).toEqual({ text: "" });
    });
  });

  describe("textMapToLocalizedJson", () => {
    it("returns LocalizedText object when primary language is present and non-empty", () => {
      const map = {
        "lang-en": { text: "Hello" },
        "lang-es": { text: "Hola" },
      };
      const res = textMapToLocalizedJson(map, languages);
      expect(res).toEqual({
        default: "Hello",
        translations: { es: "Hola" },
      });
    });

    it("returns undefined if default text is empty or whitespace", () => {
      const map = {
        "lang-en": { text: "   " },
        "lang-es": { text: "Hola" },
      };
      const res = textMapToLocalizedJson(map, languages);
      expect(res).toBeUndefined();
    });

    it("returns undefined if languages array is empty (no primary language)", () => {
      const map = { "lang-en": { text: "Hello" } };
      const res = textMapToLocalizedJson(map, []);
      expect(res).toBeUndefined();
    });
  });

  describe("optionalTextMapToLocalizedJson", () => {
    it("returns undefined when map is undefined", () => {
      expect(optionalTextMapToLocalizedJson(undefined, languages)).toBeUndefined();
    });

    it("delegates to textMapToLocalizedJson when map is provided", () => {
      const map = {
        "lang-en": { text: "Hello" },
      };
      const res = optionalTextMapToLocalizedJson(map, languages);
      expect(res).toEqual({ default: "Hello" });
    });
  });

  describe("languageMapToTextMap", () => {
    it("converts LocalizedText object to TextTranslationMap", () => {
      const raw = { default: "Welcome", translations: { es: "Bienvenido" } };
      const res = languageMapToTextMap(raw, languages);
      expect(res["lang-en"]).toEqual({ text: "Welcome" });
      expect(res["lang-es"]).toEqual({ text: "Bienvenido" });
    });

    it("falls back to default text for missing language translations", () => {
      const raw = { default: "Welcome" };
      const res = languageMapToTextMap(raw, languages);
      expect(res["lang-en"]).toEqual({ text: "Welcome" });
      expect(res["lang-es"]).toEqual({ text: "Welcome" });
    });
  });
});
