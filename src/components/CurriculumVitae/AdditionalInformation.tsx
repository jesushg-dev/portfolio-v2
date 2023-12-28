import React, { FC } from 'react';

import { ClientLocalLibraryIcon } from './ClientIcon';

import { useTranslations } from 'next-intl';

interface IadditionalInformationProps {}

const AdditionalInformation: FC<IadditionalInformationProps> = ({}) => {
  const t = useTranslations('curriculum');

  return (
    <>
      <h5 className="text-blue mb-1 flex items-center gap-1 text-lg uppercase font-semibold text-cv tracking-tight">
        <ClientLocalLibraryIcon />
        {t('header.additionalInformation')}
      </h5>
      <div className="mb-4">
        <ul className="pl-8 text-xs list-disc">
          {t.rich('additionalInformation', {
            item: (chunks) => <li className="">{chunks}.</li>,
          })}
        </ul>
      </div>
    </>
  );
};

export default AdditionalInformation;
