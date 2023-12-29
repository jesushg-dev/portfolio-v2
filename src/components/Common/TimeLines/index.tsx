import React from 'react';
import type { FC } from 'react';
import { useTranslations } from 'next-intl';
import { VscLoading } from 'react-icons/vsc';

import { Link } from '@/navigation';

interface ITimeLineProps {
  title: string;
  text: string;
  date: string;
  dateTime: string;
}

const TimeLine: FC<ITimeLineProps> = ({ title, text, date, dateTime }) => {
  return (
    <li className="time-dot relative w-full space-y-2 pb-6 pl-4">
      <time
        className=" border border-primary-500 bg-background-200 px-2 py-1 pb-1 text-xs font-normal leading-none text-primary-500"
        dateTime={dateTime}>
        {date}
      </time>
      <h3 className="text-base font-semibold text-primaryText-200">{title}</h3>
      <p className="text-sm text-primaryText-800">{text}</p>
    </li>
  );
};

const availableSteps = ['0', '1', '2', '3'] as const;

const TimeLines: FC = () => {
  const t = useTranslations('main.about.timeline');

  return (
    <ol id="timeline" className="relative flex w-full gap-4 ">
      {availableSteps.map((val) => (
        <TimeLine
          key={t(`steps.${val}.date`)}
          date={t(`steps.${val}.date`)}
          title={t(`steps.${val}.title`)}
          text={t(`steps.${val}.description`)}
          dateTime={t(`steps.${val}.dateTime`)}
        />
      ))}
      <li className="-ml-1 flex items-center gap-4 text-sm text-primaryText-800">
        <Link href="/curriculum-vitae" className="flex items-center gap-3 hover:text-primary-900">
          <VscLoading className="text-md animate-spin border border-primary-900 text-primary-200" />
          {t('subtitle')}
        </Link>
      </li>
    </ol>
  );
};

export default TimeLines;
