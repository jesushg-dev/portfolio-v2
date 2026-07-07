import { type Locale } from "@/i18n/config";

import type { TerminalStepResolved } from "./types";

export type ResolvedTerminalSequence = {
  commands: string[];
  outputs: Record<number, string[]>;
};

function pickTranslation(
  translations: TerminalStepResolved["translations"],
  locale: Locale,
  defaultLocale?: Locale,
) {
  const byLocale = translations.find((t) => t.languageCode === locale);
  if (byLocale) return byLocale;

  if (defaultLocale && defaultLocale !== locale) {
    const byDefault = translations.find(
      (t) => t.languageCode === defaultLocale,
    );
    if (byDefault) return byDefault;
  }

  return translations[0] ?? null;
}

export function splitOutputLines(output: string): string[] {
  if (!output) return [];
  return output.split("\n");
}

/**
 * Resolves ordered terminal steps into the shape expected by `<Terminal />`.
 */
export function resolveStepsForLocale(
  steps: TerminalStepResolved[],
  locale: Locale,
  defaultLocale?: Locale,
): ResolvedTerminalSequence {
  const sorted = [...steps].sort((a, b) => a.order - b.order);

  const commands: string[] = [];
  const outputs: Record<number, string[]> = {};

  sorted.forEach((step, index) => {
    const translation = pickTranslation(
      step.translations,
      locale,
      defaultLocale,
    );
    commands.push(translation?.command ?? "");
    outputs[index] = splitOutputLines(translation?.output ?? "");
  });

  return { commands, outputs };
}
