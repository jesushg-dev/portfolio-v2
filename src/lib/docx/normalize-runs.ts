/**
 * lib/docx/normalize-runs.ts
 *
 * Normalizes adjacent runs with equivalent formatting within each <w:p>
 * and removes w:proofErr markers.
 *
 * Rules:
 * - Strips all <w:proofErr .../>.
 * - Compares <w:rPr> ignoring w:lang, w:noProof, and w:spacing.
 * - Preserves rPr of the first run.
 * - Does NOT merge across hyperlinks, fields, <w:br>, <w:tab>, drawings, or images.
 */

export interface NormalizedParagraphResult {
  paragraphXml: string;
  originalRunCount: number;
  normalizedRunCount: number;
}

/**
 * Canonical signature for <w:rPr> comparison.
 * Strips w:lang, w:noProof, and w:spacing, sorts child tags, and normalizes attributes.
 */
export function getCanonicalRPrSignature(rPrXml?: string): string {
  if (!rPrXml?.trim()) return "";

  // Extract content inside <w:rPr>...</w:rPr> if wrapped
  const innerMatch = /<w:rPr(?:\s[^>]*)?>([\s\S]*?)<\/w:rPr>/.exec(rPrXml);
  const inner = innerMatch ? innerMatch[1] : rPrXml;

  // Extract all XML elements inside rPr
  const tagMatches = [
    ...inner.matchAll(
      /<w:[a-zA-Z0-9]+(?:\s[^>]*)?(?:\/>|>[\s\S]*?<\/w:[a-zA-Z0-9]+>)/g,
    ),
  ];
  const tags: string[] = [];

  for (const match of tagMatches) {
    const rawTag = match[0].trim();
    // Ignore w:lang, w:noProof, w:spacing
    if (
      /^<w:lang\b/i.test(rawTag) ||
      /^<w:noProof\b/i.test(rawTag) ||
      /^<w:spacing\b/i.test(rawTag)
    ) {
      continue;
    }
    // Normalize self-closing and attribute spacing
    const normalizedTag = rawTag.replace(/\s+/g, " ").replace(/\s*\/>$/, "/>");
    tags.push(normalizedTag);
  }

  tags.sort();
  return tags.join("|");
}

export interface ParsedRun {
  raw: string;
  rPrRaw?: string;
  isMergeable: boolean;
  text: string;
}

const FORBIDDEN_RUN_ELEMENTS =
  /<w:(br|tab|drawing|pict|object|fldChar|sym|cr|footnoteReference|commentReference)\b/i;

export function parseRunElement(runXml: string): ParsedRun {
  // Check if run contains non-text elements (br, tab, drawing, pict, etc.)
  if (FORBIDDEN_RUN_ELEMENTS.test(runXml)) {
    return {
      raw: runXml,
      isMergeable: false,
      text: "",
    };
  }

  // Extract rPr if present
  const rPrMatch = /<w:rPr(?:\s[^>]*)?>[\s\S]*?<\/w:rPr>/.exec(runXml);
  const rPrRaw = rPrMatch ? rPrMatch[0] : undefined;

  // Extract text from all <w:t> tags
  const wtMatches = [...runXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)];
  if (wtMatches.length === 0) {
    // Run has no text (e.g. empty run or styling only)
    return {
      raw: runXml,
      rPrRaw,
      isMergeable: false,
      text: "",
    };
  }

  const text = wtMatches.map((m) => m[1] ?? "").join("");

  return {
    raw: runXml,
    rPrRaw,
    isMergeable: true,
    text,
  };
}

/**
 * Builds a single <w:r> element with the given rPr and text content.
 */
function buildMergedRunXml(rPrRaw: string | undefined, text: string): string {
  const rPrPart = rPrRaw ?? "";
  const needsPreserve =
    text.startsWith(" ") || text.endsWith(" ") || text.includes("  ");
  const tTag = needsPreserve
    ? `<w:t xml:space="preserve">${text}</w:t>`
    : `<w:t>${text}</w:t>`;
  return `<w:r>${rPrPart}${tTag}</w:r>`;
}

/**
 * Normalizes all runs within a single <w:p>...</w:p> XML fragment.
 */
export function normalizeParagraphRuns(paraXml: string): string {
  // 1. Remove all w:proofErr tags
  const withoutProofErr = paraXml
    .replace(/<w:proofErr\b[^>]*\/>/g, "")
    .replace(/<w:proofErr\b[^>]*>[\s\S]*?<\/w:proofErr>/g, "");

  // 2. Identify <w:pPr>...</w:pPr> if present at beginning of <w:p>
  const pOpenMatch = /^<w:p(?:\s[^>]*)?>/.exec(withoutProofErr);
  if (!pOpenMatch) return paraXml;

  const pOpen = pOpenMatch[0];
  const pClose = "</w:p>";
  const bodyXml = withoutProofErr.slice(
    pOpen.length,
    withoutProofErr.lastIndexOf(pClose),
  );

  let pPrPart = "";
  let remainder = bodyXml;
  const pPrMatch = /^(\s*<w:pPr(?:\s[^>]*)?>[\s\S]*?<\/w:pPr>)/.exec(bodyXml);
  if (pPrMatch) {
    pPrPart = pPrMatch[1];
    remainder = bodyXml.slice(pPrPart.length);
  }

  // 3. Tokenize top-level children of remainder.
  // Immediate children can be <w:r>, <w:hyperlink>, <w:fldSimple>, <w:bookmarkStart>, etc.
  // We only merge adjacent <w:r> tokens that have isMergeable = true and matching rPr signatures.
  const tokenRegex =
    /(<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>)|(<[a-zA-Z0-9_:-]+(?:\s[^>]*)?\/>)|(<([a-zA-Z0-9_:-]+)(?:\s[^>]*)?>[\s\S]*?<\/\3>)/g;
  const tokens: (
    { kind: "run"; parsed: ParsedRun } | { kind: "other"; raw: string }
  )[] = [];

  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(remainder)) !== null) {
    if (match.index > cursor) {
      const between = remainder.slice(cursor, match.index);
      if (!/^\s*$/.test(between)) {
        tokens.push({
          kind: "other",
          raw: between,
        });
      }
    }
    cursor = match.index + match[0].length;

    if (match[1]) {
      // It's a top-level <w:r>
      tokens.push({
        kind: "run",
        parsed: parseRunElement(match[1]),
      });
    } else {
      tokens.push({
        kind: "other",
        raw: match[0],
      });
    }
  }

  if (cursor < remainder.length) {
    const trailing = remainder.slice(cursor);
    if (!/^\s*$/.test(trailing)) {
      tokens.push({
        kind: "other",
        raw: trailing,
      });
    }
  }

  if (tokens.length === 0) {
    return `${pOpen}${pPrPart}${remainder}${pClose}`;
  }

  // 4. Merge adjacent mergeable runs
  const mergedTokens: (
    { kind: "run"; parsed: ParsedRun } | { kind: "other"; raw: string }
  )[] = [];

  for (const token of tokens) {
    if (token.kind !== "run" || !token.parsed.isMergeable) {
      mergedTokens.push(token);
      continue;
    }

    const lastToken = mergedTokens[mergedTokens.length - 1];
    if (lastToken?.kind === "run" && lastToken.parsed.isMergeable) {
      const sig1 = getCanonicalRPrSignature(lastToken.parsed.rPrRaw);
      const sig2 = getCanonicalRPrSignature(token.parsed.rPrRaw);

      if (sig1 === sig2) {
        // Merge with previous run!
        // Preserve rPr of the first run
        const combinedText = lastToken.parsed.text + token.parsed.text;
        lastToken.parsed.text = combinedText;
        lastToken.parsed.raw = buildMergedRunXml(
          lastToken.parsed.rPrRaw,
          combinedText,
        );
        continue;
      }
    }

    mergedTokens.push(token);
  }

  // 5. Reconstruct paragraph XML
  const newBody = mergedTokens
    .map((t) => (t.kind === "run" ? t.parsed.raw : t.raw))
    .join("");

  return `${pOpen}${pPrPart}${newBody}${pClose}`;
}

/**
 * Normalizes all paragraphs across the entire document XML.
 */
export function normalizeDocumentXml(documentXml: string): {
  normalizedXml: string;
  paragraphCount: number;
} {
  const pRegex = /<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g;
  let count = 0;
  const normalizedXml = documentXml.replace(pRegex, (paraXml) => {
    count++;
    return normalizeParagraphRuns(paraXml);
  });

  return { normalizedXml, paragraphCount: count };
}
