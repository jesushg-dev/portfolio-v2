'use client';

import React, { FC,  useState, lazy, Suspense } from 'react';

import BgParticles from './BgParticles';
import SkillGrouped from './SkillGrouped';

import { Link } from '@/navigation';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { AnimatePresence } from 'framer-motion';

import HeaderArticle from '@/components/Common/HeaderArticle';

import { trpcReact as trpc } from '@/utils/trpc';
import { LIMIT_PER_PAGE_BIG } from '@/utils/constants';

import type { SkillType } from '@/utils/interfaces/types';
import FilterType from './FilterType';

const SkillModal = lazy(() => import('./SkillModal'));

export type SkillDef = 'backend' | 'frontend' | 'devops' | 'others';

interface ISkillsProps {}

const limit = LIMIT_PER_PAGE_BIG;

const Skills: FC<ISkillsProps> = ({}) => {
  const locale = useLocale() as 'en' | 'es' | 'nl';

  const t = useTranslations('main.skills');
  const [value, setValue] = useState(0);
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
      <div className="relative bg-background-50">
        <article className="mx-auto px-4 lg:container lg:px-20 pb-4 lg:pb-20">
          <BgParticles />
          <HeaderArticle showIcon title={t('title')} subtitle={t('subtitle')} description={t('description')} />
          <div id="skills" className="z-10 overflow-hidden">
            <div className="mb-10 lg:mb-0 relative z-10 lg:grid lg:grid-cols-12 lg:gap-16 lg:items-center">
              <div className="lg:col-span-5">
                <FilterType value={value} onChange={setValue} />
              </div>
              <div className="lg:col-span-7">
                <SkillGrouped
                  onClick={handleOpenModal}
                  type={value === 0 ? 'frontend' : value === 1 ? 'backend' : 'devops' }
                  loading={value === 0 ? frontend?.isLoading : value === 1 ? backend?.isLoading : tools?.isLoading}
                  skills={value === 0 ? frontend?.data?.data || [] : value === 1 ? backend?.data?.data || [] : tools?.data?.data || []}
                />
              </div>
            </div>

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
