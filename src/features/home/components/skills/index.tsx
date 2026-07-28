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
    <div className="bg-background relative overflow-hidden">
      <section className="relative mx-auto px-4 pb-10 lg:container lg:px-20 lg:pb-16">
        <DeferredBgParticles />
        <SkillsTerminal initialSkills={skillsData.data} />
      </section>
    </div>
  );
}

export default Skills;
