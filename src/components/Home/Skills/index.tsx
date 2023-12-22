'use client';

import React, { FC, useRef, useState, lazy, Suspense } from 'react';

import BgParticles from './BgParticles';
import SkillGrouped from './SkillGrouped';

import { Link } from '@/navigation';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { AnimatePresence, useInView } from 'framer-motion';

import { trpcReact as trpc } from '@/utils/trpc';
import { LIMIT_PER_PAGE_BIG } from '@/utils/constants';

import type { SkillType } from '@/utils/interfaces/types';

const SkillModal = lazy(() => import('./SkillModal'));

export type SkillDef = 'backend' | 'frontend' | 'devops' | 'others';

interface ISkillsProps {}

const limit = LIMIT_PER_PAGE_BIG;

const Skills: FC<ISkillsProps> = ({}) => {
  const locale = useLocale() as 'en' | 'es' | 'nl';
  const ref = useRef(null);

  const t = useTranslations('main.skills');
  const isInView = useInView(ref, { once: true });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);
  const [selectedSkillType, setSelectedSkillType] = useState<SkillDef>('backend');

  const [frontend, backend, mobile, tools] = trpc.useQueries((t) => [
    t.getSkills({ limit, locale, type: 'FRONTEND' }),
    t.getSkills({ limit, locale, type: 'BACKEND' }),
    t.getSkills({ limit, locale, type: 'MOBILE' }),
    t.getSkills({ limit, locale, type: 'TOOLS' }),
  ]);

  const handleOpenModal = (skill: SkillType, type: SkillDef) => {
    setSelectedSkillType(type);
    setSelectedSkill(skill);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="relative bg-background-50 ">
        <BgParticles />
        <article id="skills" className="z-10 mx-auto overflow-hidden px-4 py-4 lg:container lg:px-20 lg:py-20 ">
          <div className="container mx-auto">
            <div className="-mx-4 flex flex-wrap">
              <div className="w-full px-4">
                <div className="mx-auto mb-[60px] max-w-[510px] text-center">
                  <span className="mb-2 block text-lg font-semibold text-primary-700">{t('subtitle')}</span>
                  <h2 className="mb-4 text-3xl font-bold text-primaryText-500 sm:text-4xl md:text-[40px]">
                    {t('title')}
                  </h2>
                  <p className="text-body-color text-base">{t('description')}</p>
                </div>
              </div>
            </div>
          </div>
          <section
            ref={ref}
            className="grid grid-cols-1 gap-6 divide-dashed divide-divider-300 md:grid-cols-2 md:gap-6 md:divide-x lg:grid-cols-3">
            <SkillGrouped
              type="frontend"
              title="Frontend"
              isInView={isInView}
              onClick={handleOpenModal}
              ctxClass="md:pr-8"
              skills={frontend?.data?.data || []}
              loading={frontend?.isLoading}
            />

            <SkillGrouped
              type="backend"
              title="Backend"
              isInView={isInView}
              onClick={handleOpenModal}
              ctxClass="md:px-8"
              skills={backend?.data?.data || []}
              loading={backend?.isLoading}
            />

            <SkillGrouped
              type="devops"
              title="Tools"
              isInView={isInView}
              onClick={handleOpenModal}
              ctxClass="md:col-span-2 lg:col-span-1 lg:pl-8"
              skills={tools?.data?.data || []}
              loading={tools?.isLoading}
            />
          </section>
          <div className="container mx-auto flex w-full justify-center py-5">
            <Link
              scroll={true}
              href="/certificates"
              className="group z-30 mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600">
              {t('modal.seeCertificates')}
              <span aria-hidden="true" className="block transition group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>
        </article>
      </div>
      <AnimatePresence>
        <Suspense fallback={<div>Loading...</div>}>
          {isModalOpen && selectedSkill && (
            <SkillModal skill={selectedSkill} onClose={handleCloseModal} type={selectedSkillType} />
          )}
        </Suspense>
      </AnimatePresence>
    </>
  );
};

export default Skills;
