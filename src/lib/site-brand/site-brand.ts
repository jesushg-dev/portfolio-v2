export interface SiteBrandInput {
  isPrimary?: boolean;
  logoImageUrl?: string | null;
  logoInitials?: string | null;
  displayName?: string | null;
  username?: string | null;
}

export type SiteBrand =
  | { mode: "monogram"; text: "jh"; label: string }
  | { mode: "image"; imageUrl: string; label: string }
  | { mode: "text"; text: string; label: string };

const MAX_INITIALS_LENGTH = 8;

/**
 * Derive a short text mark from a display name (e.g. "Ada Lovelace" → "AL").
 * Single-token names use up to {@link MAX_INITIALS_LENGTH} characters.
 */
export function initialsFromDisplayName(
  name: string,
  maxLen = MAX_INITIALS_LENGTH,
): string {
  const parts = name.trim().split(/\s+/u).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return Array.from(parts[0]).slice(0, maxLen).join("");
  }
  return parts
    .slice(0, maxLen)
    .map((part) => Array.from(part)[0] ?? "")
    .join("");
}

/** Trimmed value, or `null` when missing or blank. */
function nonBlank(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

/** Image override → primary monogram → configured initials → name → username. */
export function resolveSiteBrand(input: SiteBrandInput): SiteBrand {
  const displayName = nonBlank(input.displayName);
  const username = nonBlank(input.username);
  const label = displayName ?? username ?? "Home";

  const imageUrl = nonBlank(input.logoImageUrl);
  if (imageUrl) {
    return { mode: "image", imageUrl, label };
  }

  if (input.isPrimary) {
    return { mode: "monogram", text: "jh", label };
  }

  const configured = nonBlank(input.logoInitials);
  if (configured) {
    return {
      mode: "text",
      text: Array.from(configured).slice(0, MAX_INITIALS_LENGTH).join(""),
      label,
    };
  }

  if (displayName) {
    const fromName = initialsFromDisplayName(displayName);
    if (fromName) {
      return { mode: "text", text: fromName, label };
    }
  }

  if (username) {
    return {
      mode: "text",
      text: Array.from(username).slice(0, MAX_INITIALS_LENGTH).join(""),
      label,
    };
  }

  return { mode: "text", text: "?", label };
}

/**
 * Ensures the accessible name of the logo link contains the visible text
 * (WCAG 2.5.3 Label in Name / Axe label-content-name-mismatch).
 */
export function getBrandAccessibleLabel(brand: SiteBrand): string {
  if (brand.mode === "image") {
    return brand.label;
  }
  const text = brand.text.trim();
  const label = brand.label.trim();
  if (!text || label.toLowerCase().includes(text.toLowerCase())) {
    return label;
  }
  return `${text} · ${label}`;
}
