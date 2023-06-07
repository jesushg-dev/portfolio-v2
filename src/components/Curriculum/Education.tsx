import React, { FC } from 'react';

import { MdImportContacts } from 'react-icons/md';
import { useTranslations } from 'next-intl';

interface IEducationProps {}

const Educations = ['computerEngineering', 'conversationalEnglish', 'webDeveloper', 'digitalSecurity'];

const Education: FC<IEducationProps> = ({}) => {
  const t = useTranslations('curriculum');
  return (
    <>
      <h5 className="text-blue mb-1 mt-2 flex items-center gap-1 border-t-2 pt-2 text-xs font-semibold">
        <MdImportContacts className="text-black" />
        {t('header.education')}
      </h5>

      {Educations.map((education) => (
        <section className="mt-2  break-inside-avoid border-b-2" key={education}>
          <header>
            <h3 className="text-sm font-bold">{t(`education.${education}.degree` as any)}</h3>
            <h4 className="my-1 text-xs font-semibold">
              {t(`education.${education}.dates` as any)} | {t(`education.${education}.location` as any)}
            </h4>
          </header>
          <p className="text-xs">{t(`education.${education}.institution` as any)}</p>
        </section>
      ))}
    </>
  );
};

export default Education;
