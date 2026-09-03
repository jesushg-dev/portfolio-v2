/** Keep this file free of `server-only` so unit tests can import it. */
export interface PublicCvTenant {
  isPrimary: boolean;
  isPublished: boolean;
}

/** Primary owner CV is always public. Other tenants only after they publish. */
export function isPublicCvVisible(tenant: PublicCvTenant | null): boolean {
  if (!tenant) return false;
  return tenant.isPrimary || tenant.isPublished;
}
