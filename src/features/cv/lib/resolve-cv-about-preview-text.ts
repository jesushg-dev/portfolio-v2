/**
 * Public CV / PDF about copy prefers aboutMe, then falls back to heroSummary.
 * Admin preview must use the same selection.
 */
export function resolveCvAboutPreviewText(
  heroSummary: string | null | undefined,
  aboutMe: string | null | undefined,
): string | null {
  const about = aboutMe?.trim() ?? "";
  if (about) return about;

  const summary = heroSummary?.trim() ?? "";
  return summary || null;
}
