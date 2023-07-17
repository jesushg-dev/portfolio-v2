import React, { FC } from 'react';

import { MdOutlineGroups3 } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import { useCvContext } from '@/hoc/CvContextProvider';

interface IpersonalReferencesProps {}

const personalReferences = ['reference1', 'reference2', 'reference3'] as const;

const PersonalReferences: FC<IpersonalReferencesProps> = ({}) => {
  const t = useTranslations('curriculum');
  const { showSectionIcons } = useCvContext();

  return (
    <>
      <h5 className="text-blue mb-1 flex items-center gap-1 text-lg uppercase font-semibold text-cv tracking-tight">
        {showSectionIcons && <MdOutlineGroups3 className="text-xs" />}
        {t('header.personalReferences')}
      </h5>

      <div className="mb-2">
        {personalReferences.map((item) => (
          <div className="flex text-xs" key={item}>
            <p className="mr-1">-</p>
            <p className="m-0">
              {t(`personalReferences.${item}.name`)} - {t(`personalReferences.${item}.role`)} - {t('telephone')}
              {t(`personalReferences.${item}.phoneNumber`)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
};

export default PersonalReferences;
