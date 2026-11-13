export function formatBlogDate(
  isoDate: string | null | undefined,
  locale: string,
): string {
  if (!isoDate) return "";
  try {
    return new Date(isoDate).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}
