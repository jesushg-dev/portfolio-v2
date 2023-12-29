import type { FC } from 'react';
import React, { memo } from 'react';
import { motion } from 'framer-motion';

import type { SkillType } from '../../../utils/interfaces/types';

import SkillItem from './SkillItem';

import type { SkillDef } from '.';

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
  type: SkillDef;
  ctxClass?: string;
  skills: SkillType[];
  loading?: boolean;
  onClick: (skill: SkillType, type: SkillDef) => void;
}

const SkillGrouped: FC<ISkillGroupedProps> = ({ type, skills, onClick, ctxClass, loading = false }) => {
  return (
    <div className={`${ctxClass} flex h-full w-full flex-col justify-start gap-6`}>
      <motion.ul initial="hidden" variants={container} animate="visible" className="grid grid-cols-skills gap-4">
        {skills.map((skill) => (
          <motion.li layout variants={item} key={skill.id} className="flex">
            <SkillItem {...skill} onClick={() => onClick(skill, type)} />
          </motion.li>
        ))}
      </motion.ul>
      {loading ? (
        <div className="w-full flex justify-center items-center">
          <div className="h-10 w-10 animate-spin rounded-full border  border-b-2 border-primary-900 " />
        </div>
      ) : null}
    </div>
  );
};

export default memo(SkillGrouped);
