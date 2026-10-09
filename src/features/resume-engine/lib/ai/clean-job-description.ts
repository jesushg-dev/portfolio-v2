export interface CleanJobDescriptionOptions {
  enableSectionFilter?: boolean;
  maxLength?: number;
}

const MAX_JD_LENGTH = 12000;

// Common zero-width and control characters to strip
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF]/g;
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const HTML_TAGS_REGEX = /<[^>]+>/g;

/**
 * Strips HTML, control and zero-width characters, and caps length at 12000
 * cutting at paragraph boundaries.
 */
export function sanitizeJobDescription(
  text: string,
  maxLength = MAX_JD_LENGTH,
): string {
  if (!text) return "";

  // 1. Strip HTML tags
  let cleaned = text.replace(HTML_TAGS_REGEX, " ");

  // 2. Strip zero-width and control characters
  cleaned = cleaned
    .replace(ZERO_WIDTH_REGEX, "")
    .replace(CONTROL_CHARS_REGEX, "");

  // 3. Normalize whitespace
  cleaned = cleaned
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ");

  // 4. Cap at maxLength cutting at paragraph boundary
  if (cleaned.length <= maxLength) {
    return cleaned.trim();
  }

  const slice = cleaned.slice(0, maxLength);
  const lastDoubleNewline = slice.lastIndexOf("\n\n");
  if (lastDoubleNewline > 0) {
    return slice.slice(0, lastDoubleNewline).trim();
  }

  const lastNewline = slice.lastIndexOf("\n");
  if (lastNewline > 0) {
    return slice.slice(0, lastNewline).trim();
  }

  return slice.trim();
}

// Section headers to discard (benefits, about us, legal/EEO)
const DISCARD_HEADER_REGEX =
  /^(?:about (?:us|the company)|sobre nosotros|quiénes somos|over ons|wie we zijn|benefits|perks|what we offer|qué ofrecemos|beneficios|wat wij bieden|equal opportunity|eeo|legal|privacy|disclaimer)\b/i;

// Section headers to keep (requirements, responsibilities, stack)
const KEEP_HEADER_REGEX =
  /^(?:requirements|qualifications|requisitos|perfil|vereisten|kwalificaties|responsibilities|duties|responsabilidades|funciones|taken|verantwoordelijkheden|tech stack|technologies|stack|tecnologías|tools|skills)\b/i;

/**
 * Conservative heuristic that keeps requirements/responsibilities/stack sections (es/en/nl)
 * and discards benefits, about us, and legal sections.
 * If no sections are detected, returns the full text.
 */
export function cleanJobDescription(
  text: string,
  options?: CleanJobDescriptionOptions,
): string {
  const sanitized = sanitizeJobDescription(text, options?.maxLength);
  if (!options?.enableSectionFilter) {
    return sanitized;
  }

  // Split into paragraphs / potential sections
  const paragraphs = sanitized.split(/\n\s*\n/);
  if (paragraphs.length <= 2) {
    return sanitized;
  }

  const keptParagraphs: string[] = [];
  let isDiscarding = false;
  let detectedSectionsCount = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const firstLine = trimmed
      .split("\n")[0]
      .trim()
      .replace(/^[#*->:\s]+|[#*:\s]+$/g, "");

    if (DISCARD_HEADER_REGEX.test(firstLine)) {
      isDiscarding = true;
      detectedSectionsCount++;
      continue;
    }

    if (KEEP_HEADER_REGEX.test(firstLine)) {
      isDiscarding = false;
      detectedSectionsCount++;
      keptParagraphs.push(trimmed);
      continue;
    }

    if (!isDiscarding) {
      keptParagraphs.push(trimmed);
    }
  }

  // Fallback: if no sections detected or filtered text became too short, return full sanitized text
  const result = keptParagraphs.join("\n\n").trim();
  if (detectedSectionsCount === 0 || result.length < 50) {
    return sanitized;
  }

  return result;
}

/**
 * Wraps clean JD inside <job_description> tags for the prompt.
 */
export function formatJobDescriptionForPrompt(
  text: string,
  options?: CleanJobDescriptionOptions,
): string {
  const cleaned = cleanJobDescription(text, options);
  return `<job_description>\n${cleaned}\n</job_description>`;
}

/**
 * High-level helper returning cleaned text and sanitization status.
 */
export function processJobDescription(
  text: string,
  options?: CleanJobDescriptionOptions,
): {
  cleanedText: string;
  wasSanitized: boolean;
} {
  const cleaned = cleanJobDescription(text, options);
  return {
    cleanedText: cleaned,
    wasSanitized: cleaned !== text,
  };
}
