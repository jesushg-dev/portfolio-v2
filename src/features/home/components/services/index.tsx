import type { FC } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import HeaderArticle from "@/components/shared/header-article";
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

  return (
    <div className="bg-background relative w-full overflow-hidden">
      <section
        aria-label={t("title")}
        className="mx-auto px-4 py-16 sm:px-6 lg:container lg:px-20 lg:py-20"
      >
        <HeaderArticle
          title={t("title")}
          subtitle={t("subtitle")}
          description={t("description")}
        />
        <ServicesBento dbServices={services} />
      </section>
    </div>
  );
};

export default Services;
