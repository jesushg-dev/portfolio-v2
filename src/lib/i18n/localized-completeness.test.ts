import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { locales, type Locale } from "@/i18n/config";
import { buildLocalizedText } from "@/lib/i18n/localized";

const DATA_DIR = join(process.cwd(), "prisma", "data");

function loadJsonFiles(): Record<string, unknown>[] {
  return readdirSync(DATA_DIR)
    .filter((name) => name.endsWith(".json"))
    .map(
      (name) =>
        JSON.parse(readFileSync(join(DATA_DIR, name), "utf8")) as Record<
          string,
          unknown
        >,
    );
}

function collectLocalizedMaps(
  value: unknown,
  path = "",
  results: { path: string; map: Partial<Record<Locale, string>> }[] = [],
): typeof results {
  if (!value || typeof value !== "object") return results;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectLocalizedMaps(item, `${path}[${index}]`, results);
    });
    return results;
  }

  const record = value as Record<string, unknown>;
  const localeKeys = locales.filter((locale) => locale in record);

  if (
    localeKeys.length >= 2 &&
    localeKeys.every((locale) => typeof record[locale] === "string")
  ) {
    const map = Object.fromEntries(
      localeKeys.map((locale) => [locale, record[locale] as string]),
    ) as Partial<Record<Locale, string>>;
    results.push({ path: path || "root", map });
    return results;
  }

  for (const [key, nested] of Object.entries(record)) {
    collectLocalizedMaps(nested, path ? `${path}.${key}` : key, results);
  }

  return results;
}

describe("seed localized content completeness", () => {
  it("every es/en/nl map in prisma/data has all three locales", () => {
    const files = loadJsonFiles();
    const missing: string[] = [];

    for (const file of files) {
      const maps = collectLocalizedMaps(file);
      for (const entry of maps) {
        for (const locale of locales) {
          if (!entry.map[locale]?.trim()) {
            missing.push(`${entry.path} missing ${locale}`);
          }
        }

        expect(() => buildLocalizedText(entry.map, "en")).not.toThrow();
      }
    }

    expect(missing).toEqual([]);
  });
});
