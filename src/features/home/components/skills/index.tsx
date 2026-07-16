import dynamic from "next/dynamic";
import { getLocale } from "next-intl/server";

import { LoadingFixed } from "@/components/shared/loading";
import SkillsTerminal from "./skills-terminal";

const BgParticles = dynamic(() => import("./bg-particles"), {
  loading: () => <LoadingFixed />,
});

async function Skills() {
  const locale = await getLocale();

  return (
    <div className="bg-background relative overflow-hidden">
      <article className="relative mx-auto px-4 pb-10 lg:container lg:px-20 lg:pb-16">
        <BgParticles />
        <SkillsTerminal locale={locale} />
      </article>
    </div>
  );
}

export default Skills;
