import type { FC } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import { api } from "@/trpc/server";
import { type Locale, locales } from "@/i18n/config";
import { ServicesBento } from "./services-bento";

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

const Services: FC = async () => {
  const t = await getTranslations("main.services");
  const locale = await getLocale();

  const services = isLocale(locale)
    ? await api.portfolio.getServicesPublic({ locale })
    : [];

  if (services.length === 0) return null;

  return (
    <div className="bg-card relative w-full overflow-hidden">
      <section
        aria-label={t("title")}
        className="mx-auto px-4 py-16 sm:px-6 lg:container lg:px-20 lg:py-20"
      >
        <div className="mx-auto mb-12 max-w-2xl text-center lg:mb-14">
          <p className="text-primary text-base font-semibold tracking-wide sm:text-lg">
            {t("subtitle")}
          </p>
          <h2 className="text-foreground mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            {t("title")}
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed sm:text-lg">
            {t("description")}
          </p>
        </div>
        <ServicesBento dbServices={services} />
      </section>
    </div>
  );
};

export default Services;
