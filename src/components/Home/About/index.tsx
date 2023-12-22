import React, { FC, useMemo } from 'react';

import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

import TimeLine from '../../Common/TimeLine';
import Terminal from '../../Common/Terminal';

import { VscLoading } from 'react-icons/vsc';

interface IAboutProps {}

const About: FC<IAboutProps> = ({}) => {
  const t = useTranslations('main.about');

  const code = useMemo(() => {
    return `
      const ${t('function.name')} = () => {
        return {
          ${t('function.json.name')}: 'Jesús Enmanuel Hernández González',
          ${t('function.json.languages')}: {
            ${t('function.language.spanish')}: 'Native',
            ${t('function.language.english')}: 'B1'
          },
          ${t('function.json.profession')}: 'Software Developer'
        }
      }
    `;
  }, [t]);

  return (
    <div className="overflow-hidden">
      <section id="about" className="mx-auto px-4 py-4 lg:container lg:px-20 lg:py-20">
        <div className="container mx-auto">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="mx-auto mb-4 text-center">
                <h2 className="mb-4 text-3xl font-bold text-primaryText-900 sm:text-4xl md:text-[40px]">
                  {t('title')}
                </h2>
              </div>
            </div>
          </div>
        </div>
        <article className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-16 lg:py-8">
          <div className="space-y-4">
            <p className="text-primaryText text-center text-base">{t('info.description1')}</p>
            <p className="text-primaryText text-center text-base">{t('info.description2')}</p>
            <p className="text-primaryText text-center text-base">{t('info.description3')}</p>
          </div>

          <Terminal language="typescript" code={code} />
        </article>

        <aside className="flex flex-col items-center gap-2">
          <div className="w-full border-b border-background-200 py-6 font-bold text-primary-600 lg:hidden">
            <h2 className="text-center">{t('timeline.title')}</h2>
          </div>
          <div className="w-full overflow-x-auto lg:pt-4">
            <div className="flex flex-col items-center gap-2">
              <ol id="timeline" className="relative flex w-full gap-4 ">
                {Array.from({ length: 4 }).map((_, index) => (
                  <TimeLine
                    key={index}
                    date={t(`timeline.steps.${index}.date` as any)}
                    title={t(`timeline.steps.${index}.title` as any)}
                    text={t(`timeline.steps.${index}.description` as any)}
                    dateTime={t(`timeline.steps.${index}.dateTime` as any)}
                  />
                ))}
                <li className="-ml-1 flex items-center gap-4 text-sm text-primaryText-800">
                  <Link href="/curriculum-vitae" className="flex items-center gap-3 hover:text-primary-900">
                    <VscLoading className="text-md animate-spin border border-primary-900 text-primary-200" />
                    {t('timeline.subtitle')}
                  </Link>
                </li>
              </ol>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default About;
