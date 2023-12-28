import React, { FC } from 'react';

import { useTranslations } from 'next-intl';

import { ClientLocalImportContactsIcon } from './ClientIcon';

interface ILanguagesProps {}

const languages = ['english', 'spanish'] as const;

const Languages: FC<ILanguagesProps> = ({}) => {
  const t = useTranslations('curriculum');

  return (
    <>
      <h5 className="text-blue mb-1 flex items-center gap-1 text-lg uppercase font-semibold text-cv tracking-tight">
        <ClientLocalImportContactsIcon />
        {t('header.languages')}
      </h5>

      <div className="mb-4">
        <ul className="text-xs list-none">
          {languages.map((language) => (
            <li className="mb-2" key={language}>
              <p className="text-sm font-bold">{t(`languages.${language}.name`)}</p>
              <p className="my-1 text-xs">{t(`languages.${language}.level`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Languages;
