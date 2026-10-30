import { cache } from "react";

import { resolveSiteBrand, type SiteBrand } from "@/lib/site-brand/site-brand";
import { resolvePublicTenant } from "@/lib/public-site/tenant";

export const getCachedSiteBrand = cache(async (): Promise<SiteBrand> => {
  const tenant = await resolvePublicTenant();
  if (!tenant) {
    return resolveSiteBrand({});
  }
  return resolveSiteBrand({
    isPrimary: tenant.isPrimary,
    logoImageUrl: tenant.logoImageUrl,
    logoInitials: tenant.logoInitials,
    displayName: tenant.displayName,
    username: tenant.username,
  });
});
