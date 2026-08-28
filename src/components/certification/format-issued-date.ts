export function formatIssuedDate(
  issuedDate: number | null,
  locale: string,
): string {
  if (!issuedDate) return "";
  const date = new Date(issuedDate);
  const month = date.toLocaleString(locale, { month: "long" });
  const year = date.getFullYear();
  return `${month}, ${year}`;
}
