import type { FC } from "react";
import { getTranslations } from "next-intl/server";
import { getPublicLocale } from "@/lib/public-site/locale";
import { api } from "@/trpc/server";
import {
  ShowcaseSection,
  ShowcaseHeading,
  ShowcaseAccordion,
} from "@/components/shared/showcase";

const HomeFaq: FC = async () => {
  const locale = await getPublicLocale();
  const t = await getTranslations({
    locale,
    namespace: "main.faq",
  });

  const items = await api.portfolio.getFaqItems({ locale });
  if (items.length === 0) return null;

  return (
    <ShowcaseSection id="faq" ariaLabelledBy="faq-heading">
      <ShowcaseHeading
        sectionId="faq"
        title={t("title")}
        titleGradient={t("titleGradient")}
      />
      <ShowcaseAccordion items={items} />
    </ShowcaseSection>
  );
};

export default HomeFaq;
