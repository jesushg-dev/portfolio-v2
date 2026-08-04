/** Shared public item shapes for Uses sections (DB-backed). */
export interface UsesEverydayItem {
  id: string;
  href: string;
  image: string;
  title: string;
  description: string;
}

export interface UsesSoftwareItem {
  id: string;
  href: string;
  image: string;
  title: string;
}

export interface UsesBrowserExtension {
  id: string;
  href: string;
  label: string;
}

export const USES_WORKSPACE_IMAGE_FALLBACK = "/uses/setup.webp";
export const USES_CODING_PREVIEW_LIGHT_FALLBACK =
  "/uses/coding/code-light.webp";
export const USES_CODING_PREVIEW_DARK_FALLBACK = "/uses/coding/code-dark.webp";
