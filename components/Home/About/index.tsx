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
    <main className="mx-auto px-4 py-4 lg:container lg:px-20 lg:py-20">
      <div className="flex items-center justify-center border-b border-gray-200 py-6 font-bold text-blue-600 lg:justify-between">
        <h2>{t('info.title')}</h2>
        <h2 className="hidden lg:block">{t('timeline.title')}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 py-2 lg:grid-cols-2 lg:gap-16 lg:py-8">
        <section>
          <div className="circle-img"></div>
          <p className="mb-4 text-justify text-sm text-black">{t('info.description')}</p>
          <p className="text-justify text-sm text-black">{t('info.description2')}</p>
          <hr className="my-6" />

          <Terminal>
            <p>
              <span className="text-blue-400">const</span> <span className="text-green-400">{t('function.name')}</span>{' '}
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
        </section>

        <section className="flex flex-col items-center">
          <div className="flex items-center justify-between border-b border-gray-200 py-6 font-bold text-blue-600 lg:hidden">
            <h2 className="lg:hidden">{t('timeline.title')}</h2>
          </div>
          <div>
            <ol className="relative border-l border-gray-200">
              {Array.from({ length: 4 }).map((_, index) => (
                <TimeLine
                  key={index}
                  date={t(`timeline.steps.${index}.date` as any)}
                  title={t(`timeline.steps.${index}.title` as any)}
                  text={t(`timeline.steps.${index}.description` as any)}
                />
              ))}
            </ol>
            <div className="-ml-1 flex items-center gap-4 text-sm text-gray-800">
              <AiOutlineLoading className="text-md animate-spin text-blue-600" />
              {t('timeline.subtitle')}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default About;
