/**
 * Extracts initials for company logos and user avatar fallbacks.
 */

export function getCompanyInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "CO";
  const words = trimmed.split(/\s+/).filter(Boolean);
  const firstWord = words[0];
  if (!firstWord) return "CO";
  if (words.length === 1) {
    return firstWord.slice(0, 2).toUpperCase();
  }
  return words
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export function getNameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstPart = parts[0];
  if (!firstPart) return "CV";
  if (parts.length === 1) return firstPart.slice(0, 2).toUpperCase();
  const lastPart = parts[parts.length - 1];
  const firstInitial = firstPart[0] ?? "";
  const lastInitial = lastPart?.[0] ?? "";
  return `${firstInitial}${lastInitial}`.toUpperCase() || "CV";
}
