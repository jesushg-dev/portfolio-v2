/**
 * Public document titles for tenant subdomains.
 * Apex / primary owner keep the branded i18n titles in messages/*.json.
 */

export function shouldUseTenantDocumentTitle(
  hostSlug: string | null,
  tenantIsPrimary: boolean | undefined,
): boolean {
  if (!hostSlug) return false;
  return tenantIsPrimary !== true;
}

export function buildTenantDocumentTitle(
  ownerName: string,
  subtitle?: string | null,
): string {
  const name = ownerName.trim();
  const sub = subtitle?.trim();
  if (!name) return sub ?? "";
  if (!sub) return name;
  return `${name} | ${sub}`;
}
