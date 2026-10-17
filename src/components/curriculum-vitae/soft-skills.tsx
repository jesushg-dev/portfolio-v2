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
  const label = skill.name.endsWith(".") ? skill.name : `${skill.name}.`;
  return (
    <li className="rounded-md border border-[#0a3d7a]/20 bg-white px-2 py-0.5 text-sm leading-[1.35] text-slate-800">
      {label}
    </li>
  );
}

const SoftSkills: FC<ISoftSkillsProps> = ({ softSkills }) => {
  const t = useTranslations("curriculum");

  if (!softSkills.length) return null;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-[0.12em] text-[#0a3d7a] uppercase before:h-4 before:w-1 before:rounded-full before:bg-[#0a3d7a] before:content-['']">
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
