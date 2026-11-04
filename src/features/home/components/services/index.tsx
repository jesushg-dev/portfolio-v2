import { getPublicLocale } from "@/lib/public-site/locale";
import type { FC } from "react";
import { getTranslations } from "next-intl/server";

import { ShowcaseHeading } from "@/components/shared/showcase";
import { api } from "@/trpc/server";
import { type Locale, locales } from "@/i18n/config";
import { ServicesCarousel } from "./services-carousel";

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

const Services: FC = async () => {
  const locale = await getPublicLocale();
  const t = await getTranslations({
    locale,
    namespace: "main.services",
  });

  const services = isLocale(locale)
    ? await api.portfolio.getServicesPublic({ locale })
    : [];

  return (
    <section
      aria-labelledby="services-heading"
      className="border-border/80 relative w-full overflow-hidden border-t py-20 md:py-28"
    >
      <div className="mx-auto mb-8 w-full px-4 sm:mb-10 sm:px-6 lg:container lg:px-20">
        <ShowcaseHeading
          sectionId="services"
          eyebrow={t("subtitle")}
          title="Engineering"
          titleGradient="expertise."
          description={t("description")}
          align="split"
          action={
            <a
              href="#skills"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand2)] transition-colors hover:underline hover:opacity-85"
            >
              {t("seeStack")}
            </a>
          }
        />
      </div>
      <div className="w-full">
        <ServicesCarousel dbServices={services} />
      </div>
    </section>
  );
};

export default Services;
