import "server-only";

import { cache } from "react";
import type { Locale } from "next-intl";

import { api } from "@/trpc/server";

export const getSkillDetailCached = cache(
  async (slug: string, locale: Locale) => {
    return api.portfolio.getSkillBySlug({ slug, locale });
  },
);
