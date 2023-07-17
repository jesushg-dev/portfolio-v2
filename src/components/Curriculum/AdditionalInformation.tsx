import React, { FC } from 'react';

import { MdLocalLibrary } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import { useCvContext } from '@/hoc/CvContextProvider';

interface IadditionalInformationProps {}

const AdditionalInformation: FC<IadditionalInformationProps> = ({}) => {
  const t = useTranslations('curriculum');
  const { showSectionIcons } = useCvContext();

  return (
    <>
      <h5 className="text-blue mb-1 flex items-center gap-1 text-lg uppercase font-semibold text-cv tracking-tight">
        {showSectionIcons && <MdLocalLibrary className="text-xs" />}
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
