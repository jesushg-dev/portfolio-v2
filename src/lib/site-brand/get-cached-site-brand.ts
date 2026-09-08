import { cache } from "react";

import { resolveSiteBrand, type SiteBrand } from "@/lib/site-brand/site-brand";
import { resolveTenant } from "@/lib/tenant/resolve";

export const getCachedSiteBrand = cache(async (): Promise<SiteBrand> => {
  const tenant = await resolveTenant();
  if (!tenant) {
    return resolveSiteBrand({});
  }
  return resolveSiteBrand({
    logoImageUrl: tenant.logoImageUrl,
    logoInitials: tenant.logoInitials,
    displayName: tenant.displayName,
    username: tenant.username,
  });
});
