import type { Locale } from "@/i18n/config";

// Common prose markers supplement exact phrase checks. Proper names, acronyms
// and short neutral labels are deliberately not classified as prose.
const WORDS: Record<Locale, Set<string>> = {
  en: new Set(
    "the with and for from through built developed improved designed implemented managed customers years working native available immediately professional proficiency basic developer engineer".split(
      " ",
    ),
  ),
  es: new Set(
    "los las una para con del mediante desde desarrollé implementé mejoré diseñé construí clientes años experiencia desarrollador ingeniero nativo bilingüe disponibilidad inmediata básico español holandés".split(
      " ",
    ),
  ),
  nl: new Set(
    "het een voor van met door gebouwd ontwikkeld verbeterd ontworpen klanten jaar ervaring beschikbaar moedertaal tweetalig vaardigheden ontwikkelaar spaans nederlands basiskennis".split(
      " ",
    ),
  ),
};

export function contentLanguage(text: string): Locale | null {
  const words = text.toLocaleLowerCase().match(/[\p{L}]+/gu) ?? [];
  const scores = (["en", "es", "nl"] as const)
    .map((locale) => ({
      locale,
      score: words.filter((word) => WORDS[locale].has(word)).length,
    }))
    .sort((a, b) => b.score - a.score);
  return scores[0].score >= 2 && scores[0].score > scores[1].score * 2
    ? scores[0].locale
    : null;
}

export function numericResumeFacts(text: string): string[] {
  return [
    ...new Set(
      text.match(/[+~−-]?\d+(?:[.,]\d+)?(?:%|\+)?|\b[ABC][12]\b/g) ?? [],
    ),
  ]
    .map((value) => value.replace(",", ".").replace("−", "-"))
    .sort();
}

const LEVELS = [
  /\b(native|bilingual|nativo|bilingüe|moedertaal|tweetalig)\b/iu,
  /\b(fluent|fluido|vloeiend)\b/iu,
  /\b(professional|profesional|professioneel|professionele)\b/iu,
  /\b(intermediate|intermedio|gemiddeld)\b/iu,
  /\b(basic|básico|básica|basiskennis|basis)\b/iu,
];
export function changesProficiency(
  source: string,
  translated: string,
): boolean {
  const level = LEVELS.findIndex((pattern) => pattern.test(source));
  return (
    level >= 0 &&
    LEVELS.findIndex((pattern) => pattern.test(translated)) !== level
  );
}

const LANGUAGE_NAMES = [
  ["english", "inglés", "ingles", "engels"],
  ["spanish", "español", "spaans"],
  ["dutch", "neerlandés", "holandés", "nederlands"],
  ["french", "francés", "frans"],
  ["german", "alemán", "duits"],
  ["portuguese", "portugués", "portugees"],
];

export function changesLanguageName(
  source: string,
  translated: string,
): boolean {
  const aliases = LANGUAGE_NAMES.find((names) =>
    names.includes(source.toLocaleLowerCase().trim()),
  );
  return Boolean(
    aliases && !aliases.includes(translated.toLocaleLowerCase().trim()),
  );
}

export function addsCredential(source: string, translated: string): boolean {
  return [
    /\b(master|masters|maestría|máster|msc)\b/iu,
    /\b(doctor|phd|doctorado|doctoraat)\b/iu,
    /\b(bachelor|bachelors|licenciatura|licenciado|licenciada|bsc)\b/iu,
    /\b(certified|certificado|certificada|gecertificeerd)\b/iu,
  ].some((level) => level.test(translated) && !level.test(source));
}
