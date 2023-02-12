import React, { FC } from 'react';
import { useTranslations } from 'next-intl';

import CodeText from '../../Common/CodeText';
import TimeLine from '../../Common/TimeLine';
import Terminal from '../../Common/Terminal';

import { AiOutlineLoading } from 'react-icons/ai';

interface IAboutProps {}

const About: FC<IAboutProps> = ({}) => {
  const t = useTranslations('about');
  return (
    <section id="about" className="mx-auto px-4 py-4 lg:container lg:px-20 lg:py-20">
      <article className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-16 lg:py-8">
        <div className="space-y-4">
          <p className="text-primaryText text-justify text-base">{t('info.description1')}</p>
          <p className="text-primaryText text-justify text-base">{t('info.description2')}</p>
          <p className="text-primaryText text-justify text-base">{t('info.description3')}</p>
        </div>

        <Terminal>
          <p>
            <span className="text-primary-400">const</span> <span className="text-green-400">{t('function.name')}</span>{' '}
            <span className="text-pink-500">=</span> () <span className="text-pink-500">{'=>'}</span> {'{'}
          </p>
          <p>
            &nbsp;&nbsp;<span className="text-pink-500">return</span> {'{'}
          </p>

          <CodeText value={t('function.json.name')} label="Jesús Enmanuel Hernández González" indent={4} />

          <p>
            &nbsp;&nbsp;&nbsp;&nbsp;{t('function.json.languages')}:{' {'}
          </p>
          <CodeText value={t('function.language.spanish')} label={t('function.languageLevel.native')} indent={6} />
          <CodeText value={t('function.language.english')} label="A2" indent={6} />
          <p>&nbsp;&nbsp;&nbsp;&nbsp;{'}'},</p>

          <CodeText value={t('function.json.profession')} label={t('function.profession')} indent={4} />
          <p>&nbsp;&nbsp;{'}'}</p>
          <p>{'}'}</p>
        </Terminal>
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
              <li className="-ml-1 flex items-center gap-4 text-sm text-secondaryText-800">
                <AiOutlineLoading className="text-md animate-spin text-primary-600" />
                {t('timeline.subtitle')}
              </li>
            </ol>
          </div>
        </div>
      </aside>
    </section>
  );
};

export default About;
