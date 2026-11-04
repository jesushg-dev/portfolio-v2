import type { FC } from "react";
import { useTranslations } from "next-intl";

import type { LocalizedCvData } from "./types";

interface ISoftSkillsProps {
  softSkills: LocalizedCvData["softSkills"];
}

function SoftSkillItem({
  skill,
}: {
  skill: LocalizedCvData["softSkills"][number];
}) {
  return (
    <li className="rounded-lg border border-[#e1e7f5] bg-white px-2.5 py-1 text-xs font-medium text-[#1d293d] shadow-2xs">
      {skill.name}
    </li>
  );
}

const SoftSkills: FC<ISoftSkillsProps> = ({ softSkills }) => {
  const t = useTranslations("curriculum");

  if (!softSkills.length) return null;

  return (
    <section>
      <h2 className="mb-3.5 flex items-center gap-2 font-mono text-[10.5px] font-bold tracking-[0.18em] text-[#1d3a8a] uppercase before:h-3.5 before:w-1 before:rounded-xs before:bg-[#1d4ed8] before:content-['']">
        {t("header.personalSkills")}
      </h2>

      <ul className="flex flex-wrap gap-1.5">
        {softSkills.map((skill) => (
          <SoftSkillItem key={skill.id} skill={skill} />
        ))}
      </ul>
    </section>
  );
};

export default SoftSkills;
