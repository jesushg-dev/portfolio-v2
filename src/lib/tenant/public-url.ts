import { env } from "@/env";
import { SITE_URL } from "@/lib/seo/site";

interface TenantPublicUrlInput {
  username: string;
  isPrimary: boolean;
  customDomain: string | null;
}

export function getTenantPublicUrl(tenant: TenantPublicUrlInput): string {
  const customDomain = tenant.customDomain?.trim();
  if (customDomain) {
    return customDomain.startsWith("http")
      ? customDomain.replace(/\/$/, "")
      : `https://${customDomain.replace(/\/$/, "")}`;
  }

  if (tenant.isPrimary) {
    return SITE_URL.replace(/\/$/, "");
  }

  const primaryDomain = env.PRIMARY_DOMAIN.replace(/\/$/, "");
  return `https://${tenant.username}.${primaryDomain}`;
}
