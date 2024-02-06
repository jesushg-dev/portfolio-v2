"use client";

import React, { useState, useEffect, memo } from "react";
import FilterType from "./FilterType";
import SkillGrouped from "./SkillGrouped";
import { trpcReact as trpc } from "@/utils/trpc";
import type { SkillType, SkillTypeType } from "@/utils/interfaces/types";
import { LIMIT_PER_PAGE_BIG } from "@/utils/constants";

interface SkillsFilterAndGroupProps {
  locale: "en" | "es" | "nl";
  handleOpenModal: (skill: SkillType, type: SkillTypeType) => void;
}

const SkillsFilterAndGroup: React.FC<SkillsFilterAndGroupProps> = ({
  handleOpenModal,
  locale,
}) => {
  const [value, setValue] = useState(0);
  const [skillsData, setSkillsData] = useState<SkillType[]>([]);

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

  const { data, isLoading } = trpc.getSkills.useQuery(
    {
      limit: LIMIT_PER_PAGE_BIG,
      locale,
      type: mapValueToSkillType(value),
    },
    {
      enabled: true,
    },
  );

  useEffect(() => {
    if (data) {
      setSkillsData(data.data);
    }
  }, [data]);

  return (
    <div className="relative z-10 mb-10 lg:mb-0 lg:grid lg:grid-cols-12 lg:items-center lg:gap-16">
      <div className="lg:col-span-5">
        <FilterType value={value} onChange={setValue} />
      </div>
      <div className="lg:col-span-7">
        <SkillGrouped
          loading={isLoading}
          skills={skillsData}
          onClick={handleOpenModal}
          type={mapValueToSkillType(value)[0]}
        />
      </div>
    </div>
  );
};

export default memo(SkillsFilterAndGroup);
