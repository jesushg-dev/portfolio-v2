import type { CvContactType } from "@prisma/client";

import { appendPortfolioWebsiteContact } from "@/lib/cv/append-portfolio-website-contact";
import { getTenantPublicUrl } from "@/lib/tenant/public-url";

type ProfileLike = {
  username: string;
  isPrimary: boolean;
  customDomain: string | null;
} | null;

interface ContactLike {
  type: CvContactType;
  value: string;
  label?: unknown;
  order?: number;
  id?: string;
}

export function resolveCvDisplayContacts<C extends ContactLike>(
  contacts: readonly C[],
  profile: ProfileLike,
): C[] {
  if (!profile) return [...contacts];

  return appendPortfolioWebsiteContact(contacts, getTenantPublicUrl(profile));
}
