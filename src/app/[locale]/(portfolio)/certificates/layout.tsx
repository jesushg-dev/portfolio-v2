import "@/app/globals.css";

import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "next-intl";
import { locales } from "@/i18n/config";
import { stackTypes } from "@/utils/constants/certificatesType";

import HeaderArticle from "@/components/shared/header-article";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("certification");

  return (
    <div className="overflow-hidden">
      <section
        id="certifications"
        className="relative mx-auto px-4 pt-20 pb-6 lg:container lg:px-20 lg:pb-20"
      >
        <div className="absolute -inset-x-10 top-0 h-96 rotate-180 [mask-image:linear-gradient(to_bottom,transparent,white)] text-gray-500/20 opacity-60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <pattern
                height={32}
                id="grid-pattern"
                patternTransform="translate(0 -1)"
                patternUnits="userSpaceOnUse"
                width={32}
                x="50%"
                y="100%"
              >
                <path d="M0 32V.5H32" fill="none" stroke="currentColor" />
              </pattern>
            </defs>
            <rect fill="url(#grid-pattern)" height="100%" width="100%" />
          </svg>
        </div>
        <div className="container mx-auto">
          <HeaderArticle
            title={t("title")}
            subtitle={t("subtitle")}
            description={t("description")}
          />
          {children}
        </div>
      </section>
    </div>
  );
}

export const generateStaticParams = () => {
  const result = locales.flatMap((locale) => [
    ...stackTypes.map((type) => ({
      locale,
      slug: [type.toLowerCase()], // slug is an array of the stack type
    })),
    { locale, slug: [] }, // When there is no slug, return an empty array
  ]);

  return result;
};
