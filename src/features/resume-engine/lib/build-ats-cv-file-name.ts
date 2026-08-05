export type CvRoleTrack = "Frontend" | "Backend" | "Fullstack";

/**
 * Strip diacritics and keep ATS-safe ASCII letters/spaces/hyphens.
 */
export function stripForAtsFileName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * "Jesús Hernández Gómez" → "Jesus Hernandez" (first + first surname).
 */
export function atsPersonNameFromFullName(fullName: string): string {
  const parts = stripForAtsFileName(fullName).split(" ").filter(Boolean);
  if (parts.length === 0) return "Candidate";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1]}`;
}

/**
 * Infer Frontend / Backend / Fullstack from position + job description text.
 */
export function inferCvRoleTrack(text: string): CvRoleTrack {
  const t = text.toLowerCase();

  const hasFull =
    /full[\s-_]?stack|fullstack|desarrollador\s+full|full\s+stack/.test(t);
  const hasFront =
    /front[\s-_]?end|frontend|front\s*end|react|vue\.?js|angular|next\.?js|ui engineer|front\b/.test(
      t,
    );
  const hasBack =
    /back[\s-_]?end|backend|back\s*end|node\.?js|django|spring\b|nestjs|api engineer|\.net\b|java engineer|back\b/.test(
      t,
    );

  if (hasFull || (hasFront && hasBack)) return "Fullstack";
  if (hasFront) return "Frontend";
  if (hasBack) return "Backend";
  return "Fullstack";
}

/**
 * Jesus Hernandez - CV - Backend - Imagemaker - ES.docx
 */
export function buildAtsCvFileName(input: {
  fullName: string;
  roleTrack: CvRoleTrack;
  company?: string | null;
  locale: string;
}): string {
  const name = atsPersonNameFromFullName(input.fullName);
  const company = stripForAtsFileName(input.company ?? "") || "General";
  const locale = stripForAtsFileName(input.locale).toUpperCase() || "EN";

  return `${name} - CV - ${input.roleTrack} - ${company} - ${locale}.docx`;
}
