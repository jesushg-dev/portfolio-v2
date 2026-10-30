import "server-only";

import { getTranslations } from "next-intl/server";
import { getPublicLocale } from "@/lib/public-site/locale";
import PortfolioItem from "@/features/home/components/portfolio/project-item";
import type { SkillDetailType } from "@/utils/interfaces/types";

interface SkillProjectCardProps {
  project: SkillDetailType["projects"][number];
}

export async function SkillProjectCard({ project }: SkillProjectCardProps) {
  const t = await getTranslations({
    locale: await getPublicLocale(),
    namespace: "main.skills",
  });
  return (
    <PortfolioItem
      {...project}
      urlName={t("page.viewProject")}
      sourceName={t("page.viewSource")}
      privateName={t("page.privateLabel")}
      privateDescription={t("page.privateDescription")}
      canSeeDemo={t("page.canSeeDemo")}
      caseStudyLabel={t("page.caseStudy")}
      kindLabels={{
        PROFESSIONAL: t("page.kind.PROFESSIONAL"),
        PERSONAL: t("page.kind.PERSONAL"),
        LEARNING: t("page.kind.LEARNING"),
      }}
      metaLabels={{
        solo: t("page.meta.solo"),
        team: t("page.meta.team", { count: project.teamSize ?? 0 }),
        now: t("page.meta.now"),
        statuses: {
          IN_PRODUCTION: t("page.statuses.IN_PRODUCTION"),
          MAINTENANCE: t("page.statuses.MAINTENANCE"),
          ARCHIVED: t("page.statuses.ARCHIVED"),
        },
      }}
      teaserLabels={{
        decisions: t("page.teaser.decisions", {
          count: project.csInfo?.decisions ?? 0,
        }),
        layers: t("page.teaser.layers"),
        metrics: t("page.teaser.metrics", {
          count: project.csInfo?.metrics ?? 0,
        }),
      }}
    />
  );
}
