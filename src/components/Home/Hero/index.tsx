import React, { useMemo } from 'react';
import type { FC } from 'react';
import { useTranslations } from 'next-intl';
import { FaDownload } from 'react-icons/fa';

import { Link } from '@/navigation';
import TypeWriter from '@/components/Common/TypeWriter';

interface IContactProps {}

const titles = ['degree', 'web', 'mobile', 'fullstack', 'frontend', 'backend'] as const;

const Contact: FC<IContactProps> = ({}) => {
  const t = useTranslations('main.heroMain');
  const strings = useMemo(() => titles.map((title) => t(`titles.${title}`)), [t]);

  return (
    <section
      id="home"
      className="hero relative flex min-h-screen w-full overflow-hidden bg-black text-secondaryText-50 before:bg-hero-main">
      <div className="z-10 mx-auto flex w-full flex-col items-start justify-center gap-2 px-4 py-8 pt-28 lg:container lg:px-10 lg:py-20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="order-1 flex w-full justify-center lg:order-2 lg:w-2/5 lg:justify-end">
            <div className="circle-img overflow-hidden transition-all ease-in-out hover:scale-105" />
          </div>
          <div className="order-2 flex w-full flex-col items-center justify-center gap-4 lg:order-1 lg:w-3/5 lg:items-start lg:justify-start">
            <h1 className="text-center text-4xl font-semibold text-white antialiased lg:text-start">
              {t('greeting')} <br className="md:hidden" /> <strong className="text-primary-500">Jesús Hernández</strong>
            </h1>
            <div className="flex justify-center text-2xl text-white lg:justify-start">
              <TypeWriter
                delay={1}
                texts={strings}
                wrapperClassName="text-2xl"
                cursorClassName="text-2xl text-primary-500"
              />
            </div>
            <div className="rounded-md p-4 backdrop-blur-2xl lg:p-0 lg:backdrop-blur-none">
              <p className="text-center text-base font-normal text-gray-300 lg:text-start">{t('description')}</p>
            </div>
            <span className="relative inline-flex">
              <Link
                href="/curriculum-vitae"
                className="pressable flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-3 text-sm shadow-lg hover:bg-primary-800">
                {t('viewCV')} <FaDownload className="text-xs" />
              </Link>
              <span className="absolute right-0 top-0 -mr-1 -mt-0 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary-500" />
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-4 mx-auto hidden flex-col items-center justify-center gap-2 lg:flex">
        <div className="scroll-indicator" />
        <p className="text-xs text-neutral-500">{t('scrollDown')}</p>
      </div>
    </section>
  );
};

export default Contact;
