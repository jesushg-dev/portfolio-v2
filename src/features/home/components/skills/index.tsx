import { getLocale } from "next-intl/server";

import DeferredBgParticles from "./deferred-bg-particles";
import SkillsTerminal from "./skills-terminal";

async function Skills() {
  const locale = await getLocale();

  return (
    <div className="bg-background relative overflow-hidden">
      <article className="relative mx-auto px-4 pb-10 lg:container lg:px-20 lg:pb-16">
        <DeferredBgParticles />
        <SkillsTerminal locale={locale} />
      </article>
    </div>
  );
}

export default Skills;
