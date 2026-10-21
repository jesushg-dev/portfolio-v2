import type { SkillDetailType } from "@/utils/interfaces/types";

import { SkillExperienceItem } from "./skill-experience-item";

interface SkillExperienceListProps {
  experiences: SkillDetailType["experiences"];
  compact?: boolean;
}

export function SkillExperienceList({
  experiences,
  compact = false,
}: SkillExperienceListProps) {
  if (experiences.length === 0) return null;

  if (compact) {
    return (
      <div className="bg-card/50 flex flex-col gap-0.5 rounded-xl p-1">
        {experiences.map((experience) => (
          <SkillExperienceItem
            key={experience.id}
            compact
            role={experience.role}
            company={experience.company}
            dates={experience.dates}
            companyLogoUrl={experience.companyLogoUrl}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card border-border overflow-hidden rounded-2xl border shadow-sm">
      <ul className="divide-border divide-y">
        {experiences.map((experience) => (
          <li key={experience.id}>
            <SkillExperienceItem
              role={experience.role}
              company={experience.company}
              dates={experience.dates}
              companyLogoUrl={experience.companyLogoUrl}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
