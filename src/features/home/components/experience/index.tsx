import { getPublicLocale } from "@/lib/public-site/locale";
import type { FC } from "react";
import { getTranslations } from "next-intl/server";

import { ShowcaseHeading, ShowcaseSection } from "@/components/shared/showcase";
import { api } from "@/trpc/server";
import { locales, type Locale } from "@/i18n/config";
import { CareerClimbChart } from "./career-climb-chart";
import { ExperienceAccordion } from "./experience-accordion";
import { HomeLeadershipSection } from "./home-leadership-section";

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

const Experience: FC = async () => {
  const locale = await getPublicLocale();
  const t = await getTranslations({
    locale,
    namespace: "main.experience",
  });

  const experiences = isLocale(locale)
    ? await api.portfolio.getExperiencesPublic({ locale, limit: 4 })
    : [];

  if (experiences.length === 0) return null;

  return (
    <>
      <ShowcaseSection id="experience" ariaLabelledBy="experience-heading">
        <ShowcaseHeading
          sectionId="experience"
          eyebrow={t("subtitle") || "Companies, roles, and measurable impact"}
          title="The"
          titleGradient="climb."
          description={t("description")}
        />

        <CareerClimbChart />

        <ExperienceAccordion
          experiences={experiences}
          viewAllLabel={t("viewAll")}
        />

        {/* Next stage callout banner from prototype */}
        <div className="border-primary/30 bg-primary/10 mt-14 flex flex-wrap items-center justify-between gap-6 rounded-3xl border p-6 sm:p-8">
          <div>
            <b className="text-foreground block text-lg font-bold tracking-tight sm:text-xl">
              {t("nextStageTitle")}
            </b>
            <span className="text-muted-foreground mt-1 block text-sm sm:text-base">
              {t("nextStageSubtitle")}
            </span>
          </div>
          <a
            href="#contact"
            className="btn-primary-glow focus-visible:ring-ring inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
          >
            {t("letsTalk")}
          </a>
        </div>
      </ShowcaseSection>

      <HomeLeadershipSection />
    </>
  );
};

export default Experience;
