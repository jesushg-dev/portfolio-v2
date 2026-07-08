/** Human-readable URL segment derived from a skill title (e.g. "Next.js" → "next-js"). */
export function skillSlugFromTitle(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "skill";
}

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

export function looksLikeSkillObjectId(value: string): boolean {
  return OBJECT_ID_RE.test(value);
}
