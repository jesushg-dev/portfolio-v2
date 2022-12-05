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
    <section className="lg:container mx-auto px-4 lg:px-20 py-4 lg:py-20">
      <div className="flex justify-center lg:justify-between items-center text-blue-600 font-bold py-6 border-b border-gray-200">
        <h2>{t('info.title')}</h2>
        <h2 className="hidden lg:block">{t('timeline.title')}</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-16 py-2 lg:py-8">
        <section>
          <div className="circle-img"></div>
          <p className="text-black text-sm text-justify mb-4">{t('info.description')}</p>
          <p className="text-black text-sm text-justify">{t('info.description2')}</p>
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
          <div className="flex justify-between items-center text-blue-600 font-bold py-6 border-b border-gray-200 lg:hidden">
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
            <div className="flex items-center gap-4 text-sm text-gray-800 -ml-1">
              <AiOutlineLoading className="animate-spin text-md text-blue-600" />
              {t('timeline.subtitle')}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
};

export default About;
