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
 * Given name + paternal surname for LatAm-style names.
 * "Jesús Enmanuel Hernández González" → "Jesus Hernandez"
 * "Jesús Hernández Gómez" → "Jesus Hernandez"
 */
export function atsPersonNameFromFullName(fullName: string): string {
  const parts = stripForAtsFileName(fullName).split(" ").filter(Boolean);
  if (parts.length === 0) return "Candidate";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} ${parts[1]}`;
  // 3+: first given name + paternal surname (second-to-last token)
  return `${parts[0]} ${parts[parts.length - 2]}`;
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

function roleTrackLabel(roleTrack: CvRoleTrack): string {
  return `${roleTrack} Developer`;
}

/**
 * Jesus Hernandez - Fullstack Developer - Nisum - ES.docx
 * Without company: Jesus Hernandez - Fullstack Developer - ES.docx
 */
export function buildAtsCvFileName(input: {
  fullName: string;
  roleTrack: CvRoleTrack;
  company?: string | null;
  locale: string;
}): string {
  const name = atsPersonNameFromFullName(input.fullName);
  const role = roleTrackLabel(input.roleTrack);
  const company = stripForAtsFileName(input.company ?? "");
  const locale = stripForAtsFileName(input.locale).toUpperCase() || "EN";

  const parts = [name, role];
  if (company) parts.push(company);
  parts.push(locale);

  return `${parts.join(" - ")}.docx`;
}
