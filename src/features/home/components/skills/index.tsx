import type { Locale } from "@/i18n/config";
import { getTranslations } from "next-intl/server";
import SkillsTerminal from "@/features/home/components/skills/skills-terminal";
import { ShowcaseSection, ShowcaseHeading } from "@/components/shared/showcase";
import { api } from "@/trpc/server";

interface SkillsProps {
  locale: Locale;
}

export default async function Skills({ locale }: SkillsProps) {
  const t = await getTranslations({ locale, namespace: "main.skills" });
  const skillsData = await api.portfolio.getSkills({ locale });
  const compactSkills = skillsData.map((s) => ({
    id: s.id,
    title: s.title,
    image: s.image,
    type: s.type,
    featured: s.featured,
    trend: s.trend,
  }));

  return (
    <ShowcaseSection ariaLabelledBy="skills-heading">
      <ShowcaseHeading
        sectionId="skills"
        eyebrow={t("subtitle")}
        title={t("titleLead")}
        titleGradient={t("titleGradient")}
        description={t("description")}
      />
      <div className="w-full">
        <SkillsTerminal initialSkills={compactSkills} showHeader={false} />
      </div>
    </ShowcaseSection>
  );
}
