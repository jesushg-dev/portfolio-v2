import React, { FC, useRef, useState, lazy, Suspense } from 'react';

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
        <article id="skills" className="mx-auto overflow-hidden px-4 py-4 lg:container lg:px-20 lg:py-20">
          <div className="container mx-auto">
            <div className="-mx-4 flex flex-wrap">
              <div className="w-full px-4">
                <div className="mx-auto mb-[60px] max-w-[510px] text-center">
                  <span className="text-primary mb-2 block text-lg font-semibold text-blue-700">{t('subtitle')}</span>
                  <h2 className="text-dark mb-4 text-3xl font-bold sm:text-4xl md:text-[40px]">{t('title')}</h2>
                  <p className="text-body-color text-base">{t('description')}</p>
                </div>
              </div>
            </div>
          </div>
          <section
            ref={ref}
            className="grid grid-cols-1 divide-dashed divide-blue-100 md:grid-cols-2 md:divide-x lg:grid-cols-3">
            <div className="flex h-full w-full flex-col justify-start gap-6 md:pr-8">
              <h3 className="w-full text-center text-xl font-bold text-gray-900">Backend</h3>
              <motion.ul
                initial="hidden"
                variants={container}
                animate={isInView ? 'visible' : 'hidden'}
                className="grid grid-cols-skills gap-4">
                {backend.map((skill) => (
                  <motion.li layout variants={item} key={skill.id} className="flex">
                    <SkillItem {...skill} onClick={handleOpenModal.bind(null, skill, 'backend')} />
                  </motion.li>
                ))}
              </motion.ul>
            </div>
            <div className="flex h-full w-full flex-col justify-start gap-6 md:px-8">
              <h3 className="w-full text-center text-xl font-bold text-gray-900">Frontend</h3>
              <motion.ul
                initial="hidden"
                variants={container}
                animate={isInView ? 'visible' : 'hidden'}
                className="grid grid-cols-skills gap-4">
                {frontend.map((skill) => (
                  <motion.li layout variants={item} key={skill.id} className="flex">
                    <SkillItem {...skill} onClick={handleOpenModal.bind(null, skill, 'frontend')} />
                  </motion.li>
                ))}
              </motion.ul>
            </div>
            <div className="flex h-full w-full flex-col justify-start gap-6 md:col-span-2 lg:col-span-1 lg:pl-8">
              <h3 className="w-full text-center text-xl font-bold text-gray-900">DevOps</h3>
              <motion.ul
                initial="hidden"
                variants={container}
                animate={isInView ? 'visible' : 'hidden'}
                className="grid grid-cols-skills gap-4">
                {devops.map((skill) => (
                  <motion.li layout variants={item} key={skill.id} className="flex">
                    <SkillItem {...skill} onClick={handleOpenModal.bind(null, skill, 'devops')} />
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </section>
        </article>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        {isModalOpen && selectedSkill && (
          <SkillModal skill={selectedSkill} onClose={handleCloseModal} type={selectedSkillType} />
        )}
      </Suspense>
    </>
  );
};

export default Skills;
