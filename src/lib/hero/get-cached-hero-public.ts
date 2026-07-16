import { cache } from "react";

import type { Locale } from "@/i18n/config";
import { api } from "@/trpc/server";

export const getCachedHeroPublic = cache(async (locale: Locale) => {
  return api.portfolio.getHeroPublic({ locale });
});
