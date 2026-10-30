import { locales, type Locale } from "@/i18n/config";
import type { ResolvedTenant } from "./resolve";

export function profileToTenant(profile: {
  userId: string;
  username: string;
  defaultLocale: string;
  isPrimary: boolean;
  isPublished: boolean;
  displayName: string | null;
  logoInitials: string | null;
  logoImageUrl: string | null;
}): ResolvedTenant {
  return {
    userId: profile.userId,
    username: profile.username,
    isPrimary: profile.isPrimary,
    isPublished: profile.isPublished,
    displayName: profile.displayName,
    logoInitials: profile.logoInitials,
    logoImageUrl: profile.logoImageUrl,
    defaultLocale: (locales as readonly string[]).includes(
      profile.defaultLocale,
    )
      ? (profile.defaultLocale as Locale)
      : "en",
  };
}
