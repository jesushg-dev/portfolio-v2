import React, { FC, memo } from 'react';

import SkillItem from '../SkillItem';
import { motion } from 'framer-motion';

import type { SkillDef } from '.';
import type { SkillType } from '../../../utils/interfaces/types';

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
  title: string;
  type: SkillDef;
  isInView: boolean;
  ctxClass?: string;
  skills: SkillType[];
  onClick: (skill: SkillType, type: SkillDef) => void;
}

const SkillGrouped: FC<ISkillGroupedProps> = ({ title, type, skills, isInView, onClick, ctxClass }) => {
  return (
    <div className={ctxClass + ' flex h-full w-full flex-col justify-start gap-6'}>
      <h3 className="w-full text-center text-xl font-bold text-gray-900">{title}</h3>
      <motion.ul
        initial="hidden"
        variants={container}
        animate={isInView ? 'visible' : 'hidden'}
        className="grid grid-cols-skills gap-4">
        {skills.map((skill) => (
          <motion.li layout variants={item} key={skill.id} className="flex">
            <SkillItem {...skill} onClick={onClick.bind(null, skill, type)} />
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
};

const areEqual = (prevProps: ISkillGroupedProps, nextProps: ISkillGroupedProps) => {
  return prevProps.skills.length === nextProps.skills.length && prevProps.isInView === nextProps.isInView;
};

export default memo(SkillGrouped, areEqual);
