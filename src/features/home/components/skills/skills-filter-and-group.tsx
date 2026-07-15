"use client";

import { useState, memo, type FC } from "react";
import FilterType from "./filter-type";
import SkillGrouped from "./skill-grouped";
import { api } from "@/trpc/react";
import type { SkillType, SkillTypeType } from "@/utils/interfaces/types";
import { skillSlugFromTitle } from "@/utils/tools/skill-slug";
import { useRouter } from "@/i18n/routing";
import { LIMIT_PER_PAGE_BIG } from "@/utils/constants";
import { type Locale } from "next-intl";

interface SkillsFilterAndGroupProps {
  locale: Locale;
}

const SkillsFilterAndGroup: FC<SkillsFilterAndGroupProps> = ({ locale }) => {
  const router = useRouter();

  const handleOpenSkill = (skill: SkillType) => {
    router.push(
      {
        pathname: "/skills/[slug]",
        params: { slug: skillSlugFromTitle(skill.title) },
      },
      { scroll: false },
    );
  };
  const [value, setValue] = useState(0);

  const mapValueToSkillType = (val: number): SkillTypeType[] => {
    switch (val) {
      case 0:
        return ["FRONTEND", "MOBILE"];
      case 1:
        return ["BACKEND", "DEVOPS"];
      case 2:
        return ["TOOLS"];
      default:
        return ["FRONTEND", "MOBILE"];
    }
  };

  const { data, isLoading } = api.portfolio.getSkills.useQuery(
    {
      limit: LIMIT_PER_PAGE_BIG,
      locale,
      type: mapValueToSkillType(value),
    },
    {
      enabled: true,
    },
  );

  const skillsData = data?.data ?? [];

  return (
    <div className="relative z-10 mb-10 lg:mb-0 lg:grid lg:grid-cols-12 lg:items-center lg:gap-16">
      <div className="lg:col-span-5">
        <FilterType value={value} onChange={setValue} />
      </div>
      <div className="lg:col-span-7">
        <SkillGrouped
          loading={isLoading}
          skills={skillsData}
          onClick={handleOpenSkill}
          type={mapValueToSkillType(value)[0]}
        />
      </div>
    </div>
  );
};

export default memo(SkillsFilterAndGroup);
