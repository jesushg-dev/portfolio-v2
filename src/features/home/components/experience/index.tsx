import { getPublicLocale } from "@/lib/public-site/locale";
import type { FC } from "react";
import { getTranslations } from "next-intl/server";

import { ShowcaseHeading, ShowcaseSection } from "@/components/shared/showcase";
import { api } from "@/trpc/server";
import { locales, type Locale } from "@/i18n/config";
import { CareerClimbChart } from "./career-climb-chart";
import SoftSkills from "../soft-skills";

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

const Experience: FC = async () => {
  const locale = await getPublicLocale();
  const t = await getTranslations({
    locale,
    namespace: "main.experience",
  });

  const [experiences, hero] = isLocale(locale)
    ? await Promise.all([
        api.portfolio.getExperiencesPublic({ locale, limit: 10 }),
        api.portfolio.getHeroPublic({ locale }),
      ])
    : [[], null];

  return (
    <>
      {experiences.length > 0 ? (
        <ShowcaseSection ariaLabelledBy="experience-heading">
          <ShowcaseHeading
            sectionId="experience"
            eyebrow={t("subtitle")}
            title={t("titleLead")}
            titleGradient={t("titleGradient")}
            description={t("description")}
          />

          <CareerClimbChart
            experiences={experiences}
            viewAllLabel={t("viewAll")}
            referenceDate={new Date()}
            nextStage={hero?.careerNextStage}
          />
        </ShowcaseSection>
      ) : null}

      <SoftSkills />
    </>
  );
};

export default Experience;
