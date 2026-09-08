/**
 * Public CV / PDF about copy prefers heroSummary, then aboutMe.
 * Admin preview must use the same selection.
 */
export function resolveCvAboutPreviewText(
  heroSummary: string | null | undefined,
  aboutMe: string | null | undefined,
): string | null {
  const summary = heroSummary?.trim() ?? "";
  if (summary) return summary;

  const about = aboutMe?.trim() ?? "";
  return about || null;
}
