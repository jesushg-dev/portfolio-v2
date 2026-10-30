/** Internal render addresses; browser-facing paths remain owned by next-intl. */
export const PUBLIC_RENDER_PREFIX = "/p";

export function publicRenderScope(tenantSlug: string | null): string {
  return tenantSlug ? `tenant-${tenantSlug}` : "primary";
}

export function isAccountPath(pathname: string): boolean {
  return /^\/(?:admin|login|register|forgot-password|reset-password|two-factor)(?:\/|$)/.test(
    pathname,
  );
}
