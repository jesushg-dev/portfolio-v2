import React, { FC, useRef, useState, lazy } from 'react';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useTranslations } from 'next-intl';

import SkillItem from '../SkillItem';
import { ISkill } from '../../../utils/interfaces/portfolio';

const SkillModal = lazy(() => import('../SkillModal'));

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

type SkillType = 'backend' | 'frontend' | 'devops' | 'others';

interface ISkillsProps {
  others: ISkill[];
  backend: ISkill[];
  frontend: ISkill[];
  devops: ISkill[];
}

const Skills: FC<ISkillsProps> = ({ backend, frontend, devops }) => {
  const ref = useRef(null);

  const t = useTranslations('skills');
  const isInView = useInView(ref, { once: true });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<ISkill | null>(null);
  const [selectedSkillType, setSelectedSkillType] = useState<SkillType>('backend');

  const handleOpenModal = (skill: ISkill, type: SkillType) => {
    setSelectedSkillType(type);
    setSelectedSkill(skill);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="bg-white">
        <main className="mx-auto overflow-hidden px-4 py-4 lg:container lg:px-20 lg:py-20">
          <h2 className="flex items-center justify-center border-b border-gray-200 py-6 font-bold text-blue-600 lg:justify-between">
            {t('title')}
          </h2>

          <section ref={ref} className="grid grid-cols-1 divide-x md:grid-cols-2 lg:grid-cols-3">
            <div className="flex h-full w-full flex-col justify-start md:pr-8">
              <h3 className="my-6 w-full text-center text-2xl font-bold text-gray-900">Backend</h3>
              <motion.ul
                initial="hidden"
                variants={container}
                animate={isInView ? 'visible' : 'hidden'}
                className="grid grid-cols-3 gap-4">
                {backend.map((skill) => (
                  <motion.li layout variants={item} key={skill.id} className="flex">
                    <SkillItem {...skill} onClick={handleOpenModal.bind(null, skill, 'backend')} />
                  </motion.li>
                ))}
              </motion.ul>
            </div>
            <div className="flex h-full w-full flex-col justify-start md:px-8">
              <h3 className="my-6 w-full text-center text-2xl font-bold text-gray-900">Frontend</h3>
              <motion.ul
                initial="hidden"
                variants={container}
                animate={isInView ? 'visible' : 'hidden'}
                className="grid grid-cols-3 gap-4">
                {frontend.map((skill) => (
                  <motion.li layout variants={item} key={skill.id} className="flex">
                    <SkillItem {...skill} onClick={handleOpenModal.bind(null, skill, 'frontend')} />
                  </motion.li>
                ))}
              </motion.ul>
            </div>
            <div className="flex h-full w-full flex-col justify-start lg:pl-8">
              <h3 className="my-6 w-full text-center text-2xl font-bold text-gray-900">DevOps</h3>
              <motion.ul
                initial="hidden"
                variants={container}
                animate={isInView ? 'visible' : 'hidden'}
                className="grid grid-cols-3 gap-4">
                {devops.map((skill) => (
                  <motion.li layout variants={item} key={skill.id} className="flex">
                    <SkillItem {...skill} onClick={handleOpenModal.bind(null, skill, 'devops')} />
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </section>
        </main>
      </div>
      {isModalOpen && selectedSkill && (
        <SkillModal skill={selectedSkill} onClose={handleCloseModal} type={selectedSkillType} />
      )}
    </>
  );
};

export default Skills;
