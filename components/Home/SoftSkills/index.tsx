import React, { FC } from 'react';

import { useTranslations } from 'next-intl';

import SoftSkillItem from '../SoftSkillItem';

import { RiHandHeartLine, RiGpsLine, RiDashboard3Line } from 'react-icons/ri';
import { RiSettingsLine, RiTimerFlashLine, RiMapPinTimeLine, RiQuillPenLine } from 'react-icons/ri';
import { RiMedal2Line, RiTeamLine, RiCalendarTodoLine, RiShieldStarLine, RiEmotion2Line } from 'react-icons/ri';

interface ISoftSkillsProps {}

const SoftSkills: FC<ISoftSkillsProps> = ({}) => {
  const t = useTranslations('soft-skills');

  return (
    <section className="hero relative flex h-[50vh] w-full flex-col items-center  overflow-hidden bg-black before:bg-hero-skills md:h-[65vh]">
      <h2 className="text-dark z-10  mb-4 p-10 text-4xl font-bold text-white">{t('title')}</h2>
      <div className="absolute inset-0 z-20 flex h-full w-full scroll-pl-16 items-center gap-6 overflow-x-auto overflow-y-hidden pt-10 text-white lg:snap-x lg:snap-mandatory">
        <div className="shrink-0 snap-center">
          <div className="w-4 shrink-0 sm:w-24"></div>
        </div>
        <SoftSkillItem
          icon={RiTeamLine}
          title={t('skills.teamwork.title')}
          description={t('skills.teamwork.description')}
        />
        {/*<SoftSkillItem
          icon={RiEmotion2Line}
          title={t('skills.communication.title')}
          description={t('skills.communication.description')}
        />*/}
        <SoftSkillItem
          icon={RiShieldStarLine}
          title={t('skills.problem-solving.title')}
          description={t('skills.problem-solving.description')}
        />
        <SoftSkillItem
          icon={RiMedal2Line}
          title={t('skills.goal-oriented.title')}
          description={t('skills.goal-oriented.description')}
        />
        <SoftSkillItem
          icon={RiSettingsLine}
          title={t('skills.adaptability.title')}
          description={t('skills.adaptability.description')}
        />
        <SoftSkillItem
          icon={RiTimerFlashLine}
          title={t('skills.time-management.title')}
          description={t('skills.time-management.description')}
        />
        {/*<SoftSkillItem
          icon={RiQuillPenLine}
          title={t('skills.creativity.title')}
          description={t('skills.creativity.description')}
      />*/}
        <SoftSkillItem
          icon={RiHandHeartLine}
          title={t('skills.leadership.title')}
          description={t('skills.leadership.description')}
        />
        {/*<SoftSkillItem
          icon={RiCalendarTodoLine}
          title={t('skills.organization.title')}
          description={t('skills.organization.description')}
        />*/}
        <SoftSkillItem
          icon={RiMapPinTimeLine}
          title={t('skills.responsibility.title')}
          description={t('skills.responsibility.description')}
        />
        {/*
        <SoftSkillItem
          icon={RiGpsLine}
          title={t('skills.initiative.title')}
          description={t('skills.initiative.description')}
        />*/}
        <SoftSkillItem
          icon={RiDashboard3Line}
          title={t('skills.commitment.title')}
          description={t('skills.commitment.description')}
        />
        <div className="shrink-0 snap-center">
          <div className="w-4 shrink-0 sm:w-24"></div>
        </div>
      </div>
    </section>
  );
};

export default SoftSkills;
