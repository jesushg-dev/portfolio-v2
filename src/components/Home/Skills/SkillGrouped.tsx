import type { FC } from "react";
import React, { memo } from "react";
import { motion } from "motion/react";

import SkillItem from "./SkillItem";
import type { SkillType, SkillTypeType } from "../../../utils/interfaces/types";

const container = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.15,
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { x: 50, y: -30, opacity: 0 },
  visible: { x: 0, y: 0, opacity: 1 },
};

interface ISkillGroupedProps {
  type: SkillTypeType;
  ctxClass?: string;
  skills: SkillType[];
  loading?: boolean;
  onClick: (skill: SkillType, type: SkillTypeType) => void;
}

const SkillGrouped: FC<ISkillGroupedProps> = ({
  type,
  skills,
  onClick,
  ctxClass,
  loading = false,
}) => {
  return (
    <div
      className={`${ctxClass} flex h-full w-full flex-col justify-start gap-6`}
    >
      {loading ? (
        <div className="flex w-full items-center justify-center">
          <div className="border-primary-900 h-10 w-10 animate-spin rounded-full border border-b-2" />
        </div>
      ) : (
        <motion.ul
          initial="hidden"
          variants={container}
          animate="visible"
          className="grid grid-cols-(--grid-cols-skills) gap-4"
        >
          {skills.map((skill) => (
            <motion.li layout variants={item} key={skill.id} className="flex">
              <SkillItem {...skill} onClick={() => onClick(skill, type)} />
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
};

export default memo(SkillGrouped);
