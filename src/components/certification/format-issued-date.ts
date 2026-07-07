export function formatIssuedDate(issuedDate: number | null): string {
  if (!issuedDate) return "";
  const date = new Date(issuedDate);
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();
  return `${month}, ${year}`;
}
