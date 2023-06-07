import React, { FC } from 'react';

import { MdLocalLibrary } from 'react-icons/md';
import { useTranslations } from 'next-intl';

interface IadditionalInformationProps {}


const AdditionalInformation: FC<IadditionalInformationProps> = ({}) => {
  const t = useTranslations('curriculum');
  return (
    <>
      <h5 className="text-blue mb-1 mt-2 flex items-center gap-1 border-t-2 pt-2 text-xs font-semibold">
        <MdLocalLibrary className="text-black" />
        {t('header.additionalInformation')}
      </h5>

      <div className="grid grid-cols-2">
        {t.rich('additionalInformation', {
          item: (chunks) => (
            <div className="flex text-xs">
              <p className="mr-1">-</p>
              <p className="m-0">{chunks}</p>
            </div>
          ),
        })}
      </div>
    </>
  );
};

export default AdditionalInformation;
