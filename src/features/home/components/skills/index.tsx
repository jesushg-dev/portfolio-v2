import { getLocale } from "next-intl/server";

import { api } from "@/trpc/server";
import { LIMIT_PER_PAGE_BIG } from "@/utils/constants";
import { type Locale, locales } from "@/i18n/config";

import DeferredBgParticles from "./deferred-bg-particles";
import SkillsTerminal from "./skills-terminal";

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

async function Skills() {
  const locale = await getLocale();
  const skillsData = isLocale(locale)
    ? await api.portfolio.getSkills({
        limit: LIMIT_PER_PAGE_BIG,
        locale,
      })
    : { data: [] };

  return (
    <div className="bg-muted/50 relative w-full overflow-hidden">
      <section id="skills" className="relative mx-auto px-4 py-16 sm:px-6 lg:container lg:px-20 lg:py-20">
        <DeferredBgParticles />
        <SkillsTerminal initialSkills={skillsData.data} />
      </section>
    </div>
  );
}

export default Skills;
