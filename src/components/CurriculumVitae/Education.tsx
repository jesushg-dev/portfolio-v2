import React, { FC } from 'react';

import { ClientLocalImportContactsIcon } from './ClientIcon';

import { useTranslations } from 'next-intl';

interface IEducationProps {}

const educations = ['computerEngineering', 'webDeveloper', 'digitalSecurity'] as const;

const Education: FC<IEducationProps> = ({}) => {
  const t = useTranslations('curriculum');

  return (
    <>
      <h5 className="text-blue mb-1 flex items-center gap-1 text-lg uppercase font-semibold text-cv tracking-tight">
        <ClientLocalImportContactsIcon />
        {t('header.education')}
      </h5>

      <div className="mb-4">
        {educations.map((education) => (
          <section className="mb-4" key={education}>
            <header>
              <h5 className="text-sm font-bold">{t(`education.${education}.degree`)}</h5>
              <h6 className="text-xs">
                {t(`education.${education}.institution`)} | {t(`education.${education}.location`)}
              </h6>
            </header>
            <p className="my-1 text-xs">{t(`education.${education}.dates`)}</p>
          </section>
        ))}
      </div>
    </>
  );
};

export default Education;
