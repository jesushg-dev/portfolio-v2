import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { type Locale } from "@/i18n/config";
import { buildLocaleAlternates } from "@/lib/seo/alternates";
import { buildSocialMetadata } from "@/lib/seo/site";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}): Promise<Metadata> {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const appLocale = locale as Locale;
  const isCvFlow = typeof query.next === "string" && query.next.includes("/cv");

  const t = await getTranslations({
    locale: appLocale,
    namespace: "auth.register",
  });
  const title = t(isCvFlow ? "titleCv" : "titlePortfolio");
  const description = t(isCvFlow ? "descriptionCv" : "descriptionPortfolio");
  const alternates = buildLocaleAlternates(appLocale, "/register");
  const canonicalUrl =
    typeof alternates.canonical === "string"
      ? alternates.canonical
      : alternates.canonical instanceof URL
        ? alternates.canonical.href
        : "https://www.jesushg.com/register";

  return {
    title,
    description,
    alternates,
    ...buildSocialMetadata({
      title,
      description,
      url: canonicalUrl,
    }),
  };
}
