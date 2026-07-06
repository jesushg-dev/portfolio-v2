#!/usr/bin/env node
/**
 * check-no-dark.mjs
 *
 * Pre-commit guard: rejects any `dark:` Tailwind class in src/components/ui/
 *
 * WHY: This project uses a data-theme="..." attribute system (main-light,
 * main-dark, orange-light, orange-dark, etc.) defined in globals.css.
 * Tailwind's `dark:` variant relies on `@media (prefers-color-scheme: dark)`
 * or the `.dark` class selector — neither of which is used here.
 * Therefore, `dark:` classes in UI components are ALWAYS DEAD CODE and
 * will never activate when the user switches themes.
 *
 * The semantic token bridge in globals.css (@theme block) already maps
 * --color-background, --color-primary, etc. to the correct values for
 * each data-theme, so no dark: overrides are needed.
 */

import { readFileSync } from "fs";

const files = process.argv.slice(2);

if (files.length === 0) {
  process.exit(0);
}

const DARK_CLASS_PATTERN = /\bdark:[a-zA-Z0-9_/[\]().*:%-]+/g;

let hasErrors = false;

for (const file of files) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    // File may have been deleted — skip
    continue;
  }

  const lines = content.split("\n");
  const matches = [];

  lines.forEach((line, index) => {
    const found = [...line.matchAll(DARK_CLASS_PATTERN)];
    if (found.length > 0) {
      found.forEach((match) => {
        matches.push({
          line: index + 1,
          class: match[0],
          snippet: line.trim(),
        });
      });
    }
  });

  if (matches.length > 0) {
    hasErrors = true;
    console.error(`\n\u274c  dark: class detected in ${file}`);
    console.error(
      `   This project uses data-theme="..." for theming \u2014 dark: is dead code here.\n`,
    );
    matches.forEach(({ line, class: cls, snippet }) => {
      console.error(`   Line ${line}: ${cls}`);
      console.error(`   \u2192 ${snippet}\n`);
    });
  }
}

if (hasErrors) {
  console.error(
    "\u{1F4A1} Fix: Replace dark: classes with semantic tokens (bg-primary, text-foreground, etc.)\n" +
      "   The @theme bridge in globals.css handles theme switching automatically.\n" +
      "   See: src/app/globals.css \u2192 @theme block\n",
  );
  process.exit(1);
}

process.exit(0);
