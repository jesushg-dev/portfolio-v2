import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const LOCALES = ["en", "es", "nl"];
const DATA_DIR = join(process.cwd(), "prisma", "data");

/**
 * @typedef {Object} LocalizedMap
 * @property {string} path - Path within the JSON object
 * @property {Record<string, string>} map - Locale → text dictionary
 */

/**
 * Recursively walks an object and collects all localized maps
 * (objects that have at least two of the defined locales and all their values are strings).
 *
 * @param {unknown} value - Value to inspect (can be object, array, primitive)
 * @param {string} path - Current path within the object (for debugging)
 * @param {LocalizedMap[]} results - Accumulator for results
 * @returns {LocalizedMap[]} - List of found maps
 */
function collectLocalizedMaps(value, path = "", results = []) {
  if (!value || typeof value !== "object") return results;

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      collectLocalizedMaps(value[i], `${path}[${i}]`, results);
    }
    return results;
  }

  // value is an object (not an array)
  const obj = /** @type {Record<string, unknown>} */ (value);
  const localeKeys = LOCALES.filter((locale) => locale in obj);

  if (
    localeKeys.length >= 2 &&
    localeKeys.every((locale) => typeof obj[locale] === "string")
  ) {
    // Build a map with only the existing string keys
    const map = Object.fromEntries(
      localeKeys.map((locale) => [locale, /** @type {string} */ (obj[locale])]),
    );
    results.push({
      path: path || "root",
      map,
    });
    return results;
  }

  // Continue traversing the object's properties
  for (const [key, nested] of Object.entries(obj)) {
    collectLocalizedMaps(nested, path ? `${path}.${key}` : key, results);
  }

  return results;
}

// --- Main execution ---
/** @type {string[]} */
const issues = [];

for (const fileName of readdirSync(DATA_DIR).filter((name) =>
  name.endsWith(".json"),
)) {
  const filePath = join(DATA_DIR, fileName);
  const fileContent = readFileSync(filePath, "utf8");
  /** @type {unknown} */
  const json = JSON.parse(fileContent);

  const maps = collectLocalizedMaps(json);
  for (const entry of maps) {
    for (const locale of LOCALES) {
      if (!entry.map[locale]?.trim()) {
        issues.push(`${fileName} → ${entry.path} missing "${locale}"`);
      }
    }
  }
}

if (issues.length > 0) {
  console.error("Locale completeness issues:\n");
  for (const issue of issues) {
    console.error(`  - ${issue}`);
  }
  process.exit(1);
}

console.log("All seed localized maps include en, es, and nl.");
