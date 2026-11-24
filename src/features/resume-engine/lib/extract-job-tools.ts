export function technologyNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function joinedTechnologyKey(key: string) {
  return key.replace(/(?<=\p{L})[ .-]+(?=\p{L})/gu, "");
}

export interface TechnologyEquivalence {
  original: string;
  proposed: string;
}

/** Literal names own their spelling. Punctuation and approved equivalences need one unambiguous owner. */
export function knownTechnologySpellings(
  names: Iterable<string>,
  observed: Iterable<string> = [],
  equivalences: Iterable<TechnologyEquivalence> = [],
) {
  const owners = new Map<string, string>();
  const joinedOwners = new Map<string, string | null>();
  for (const name of names) {
    const key = technologyNameKey(name);
    owners.set(key, key);
    const joined = joinedTechnologyKey(key);
    const previous = joinedOwners.get(joined);
    joinedOwners.set(
      joined,
      previous === undefined || previous === key ? key : null,
    );
    const words = name.trim().split(/\s+/u);
    if (
      words.length === 2 &&
      words.every((word) => /^\.?\p{L}[\p{L}\p{N}.+#-]*$/u.test(word)) &&
      words.some((word) => /^\p{Lu}{2,}s?$/u.test(word))
    ) {
      const reversed = technologyNameKey(`${words[1]} ${words[0]}`);
      // A literal profile name always owns its spelling, in either insertion order.
      if (!owners.has(reversed)) owners.set(reversed, key);
    }
  }
  for (const key of [
    ...joinedOwners.keys(),
    ...Array.from(observed, technologyNameKey),
  ]) {
    const owner = joinedOwners.get(joinedTechnologyKey(key));
    if (owner && !owners.has(key)) owners.set(key, owner);
  }
  for (const { original, proposed } of equivalences) {
    const originalKey = technologyNameKey(original);
    const proposedKey = technologyNameKey(proposed);
    const owner = owners.get(originalKey);
    // Applicant confirmation binds a vacancy spelling only when it does not own another catalog item.
    if (owner === originalKey && !owners.has(proposedKey)) {
      owners.set(proposedKey, owner);
    }
  }
  return owners;
}

/** Match the longest complete spelling supplied by the vacancy or the profile. */
export function createTechnologyMatcher(names: Iterable<string>) {
  const alternatives = [...new Set(Array.from(names, technologyNameKey))]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((name) =>
      name.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&").replace(/ /g, "[ \\t]+"),
    )
    .join("|");
  const pattern = new RegExp(
    "(?<![\\p{L}\\p{N}_+#.])(?:" +
      (alternatives || "(?!)") +
      ")(?![\\p{L}\\p{N}_+#]|\\.[\\p{L}\\p{N}])",
    "giu",
  );
  return (text: string) =>
    Array.from(text.matchAll(pattern), ({ 0: name, index }) => ({
      name,
      index,
      key: technologyNameKey(name),
    }));
}

// Immediate suggestions before an AI response is available. Read explicit stack
// lists and distinctive identifiers. Ordinary prose is left to the AI or user.
function vacancyTerms(text: string): string[] {
  const terms: string[] = [];
  text = text.replace(/https?:\/\/\S+|\b\S+@\S+\.\S+/giu, " ");
  const identifiers =
    text.match(
      /(?<![\p{L}\p{N}_.])\.?[\p{L}][\p{L}\p{N}]*(?:[./-][\p{L}\p{N}]+)*(?:\+\+|#)?/gu,
    ) ?? [];
  for (const word of identifiers) {
    if (/^[A-Z][A-Z\d]{1,}$|[a-z][A-Z]|[.#/+]/u.test(word)) terms.push(word);
  }
  for (const line of text.split(/\r?\n/u)) {
    const stack =
      /(?:^|\b)(?:tech stack|stack|technologies|tecnologías|technologieën|tools|herramientas|vaardigheden|skills)\s*:\s*(.+)/iu.exec(
        line,
      );
    const list =
      stack?.[1] ??
      /(?:skilled in|experience (?:with|in)|experiencia (?:con|en)|ervaring met|requiring|using|utilizando)\s+([^;\n]+)/iu.exec(
        line,
      )?.[1];
    if (!list) continue;
    for (const part of list
      .split(/[.!?](?=\s|$)/u, 1)[0]
      .split(/\s*[,;|]\s*|\s+(?:and|or|y|o|en|of)\s+/iu)) {
      const term = part
        .trim()
        .replace(/^(?:and|or|y|o|en|of)\s+/iu, "")
        .replace(/\s+(?:required|preferred|requerid[oa]s?|vereist)\b.*$/iu, "")
        .replace(/[.!:]+$/u, "")
        .trim();
      if (
        term &&
        term.length <= 80 &&
        term.split(/\s+/u).length <= 5 &&
        (stack ||
          /^(?:[.\p{Lu}][\p{L}\d.#/+-]*)(?:\s+[.\p{Lu}\d][\p{L}\d.#/+-]*)*$/u.test(
            term,
          ))
      )
        terms.push(term);
    }
  }
  // A dotted product followed by a capitalized qualifier is one spelling.
  for (const [name] of text.matchAll(
    /(?<![\p{L}\d_.])\.?[\p{L}\d]*\.[\p{L}][\p{L}\d]*(?:[ \t]+[\p{Lu}][\p{Ll}\d]+)+/gu,
  ))
    terms.push(name);
  for (const [, name] of text.matchAll(
    /(?:\b(?:a|an|un|een)\s+)([\p{Lu}][\p{L}\d.+#-]+)\s+(?:engineer|developer|ontwikkelaar)\b/gu,
  ))
    terms.push(name);
  return terms;
}

/** A rewrite that keeps the sentence but swaps its named tool must support the entire replacement. */
export function rewrittenTechnologyNames(
  original: string,
  proposed: string,
  match: ReturnType<typeof createTechnologyMatcher>,
): string[] {
  if (original === proposed) return [];
  const candidates: string[] = [];
  if (proposed.startsWith(original + " "))
    candidates.push(proposed.slice(original.length).trim());
  for (const { index, name } of match(original)) {
    const before = original.slice(0, index);
    const after = original.slice(index + name.length);
    if (proposed.startsWith(before) && proposed.endsWith(after)) {
      candidates.push(
        proposed.slice(before.length, proposed.length - after.length),
      );
    }
  }
  return candidates.filter((name) =>
    /^[.\p{Lu}][\p{L}\d.#+/-]*(?: [.\p{Lu}\d][\p{L}\d.#+/-]*){0,3}$/u.test(
      name,
    ),
  );
}

export function extractJobTools(
  vacancy: string,
  candidateSkills: string[] = [],
  analysisTerms: string[] = [],
  equivalences: Iterable<TechnologyEquivalence> = [],
): string[] {
  const provided = [
    ...knownTechnologySpellings(candidateSkills, [], equivalences).keys(),
    ...analysisTerms,
  ];
  const matches = createTechnologyMatcher([
    ...provided,
    ...vacancyTerms(vacancy),
  ])(vacancy);
  const byKey = new Map(matches.map(({ name, key }) => [key, name]));
  const preferred = new Set(provided.map(technologyNameKey));
  return [...byKey.values()].sort(
    (a, b) =>
      Number(preferred.has(technologyNameKey(b))) -
        Number(preferred.has(technologyNameKey(a))) || a.localeCompare(b),
  );
}

export function vacancySkillSuggestions(
  vacancy: string,
  knownNames: string[],
  additionalNames: string[] = [],
  equivalences: Iterable<TechnologyEquivalence> = [],
): string[] {
  const terms = extractJobTools(
    vacancy,
    knownNames,
    additionalNames,
    equivalences,
  );
  const known = knownTechnologySpellings(knownNames, terms, equivalences);
  return terms.filter((term) => !known.has(technologyNameKey(term)));
}

/** Explicit selections can also be complete terms within a longer stack phrase. */
export function literalVacancyTerm(
  vacancy: string,
  term: string,
): string | undefined {
  return createTechnologyMatcher([term])(vacancy)[0]?.name;
}
