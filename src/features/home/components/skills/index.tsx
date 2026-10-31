import type { Locale } from "@/i18n/config";
import SkillsTerminal from "@/features/home/components/skills/skills-terminal";
import { api } from "@/trpc/server";

interface SkillsProps {
  locale: Locale;
}

export default async function Skills({ locale }: SkillsProps) {
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
    <div className="bg-muted border-border/40 relative w-full overflow-hidden border-y">
      <section className="relative mx-auto px-4 py-16 sm:px-6 lg:container lg:px-20 lg:py-20">
        <SkillsTerminal initialSkills={compactSkills} />
      </section>
    </div>
  );
}
