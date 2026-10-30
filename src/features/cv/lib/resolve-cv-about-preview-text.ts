/**
 * The CV summary belongs exclusively to the CV editor.
 * Admin preview must use the same selection.
 */
export function resolveCvAboutPreviewText(
  aboutMe: string | null | undefined,
): string | null {
  const about = aboutMe?.trim() ?? "";
  if (about) return about;

  return null;
}
