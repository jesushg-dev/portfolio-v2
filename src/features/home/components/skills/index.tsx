import type { ComponentProps } from "react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import SkillsTerminal from "@/features/home/components/skills/skills-terminal";
import { ShowcaseSection, ShowcaseHeading } from "@/components/shared/showcase";

interface SkillsProps {
  locale: Locale;
  skills: ComponentProps<typeof SkillsTerminal>["skills"];
}

export default async function Skills({ locale, skills }: SkillsProps) {
  const t = await getTranslations({ locale, namespace: "main.skills" });

  return (
    <ShowcaseSection ariaLabelledBy="skills-heading">
      <ShowcaseHeading
        sectionId="skills"
        eyebrow={t("subtitle")}
        title={t("titleLead")}
        titleGradient={t("titleGradient")}
        description={t("description")}
      />
      {skills.length > 0 ? (
        <SkillsTerminal skills={skills} />
      ) : (
        <p className="text-muted-foreground mt-6 text-center">{t("empty")}</p>
      )}
    </ShowcaseSection>
  );
}
