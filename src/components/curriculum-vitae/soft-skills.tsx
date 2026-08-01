import type { FC } from "react";
import { useTranslations } from "next-intl";

import type { LocalizedCvData } from "./types";

interface ISoftSkillsProps {
  softSkills: LocalizedCvData["softSkills"];
}

function SoftSkillItem({ skill }: { skill: LocalizedCvData["softSkills"][number] }) {
  return <li>{skill.name}.</li>;
}

const SoftSkills: FC<ISoftSkillsProps> = ({ softSkills }) => {
  const t = useTranslations("curriculum");

  if (!softSkills.length) return null;

  return (
    <>
      <h5 className="text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.personalSkills")}
      </h5>

      <div className="mb-4">
        <ul className="list-disc pl-8 text-sm text-[#1a1a1a]">
          {softSkills.map((skill) => (
            <SoftSkillItem key={skill.id} skill={skill} />
          ))}
        </ul>
      </div>
    </>
  );
};

export default SoftSkills;
