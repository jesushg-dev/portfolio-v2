import React, { FC } from 'react';

import { MdOutlineGroups3 } from 'react-icons/md';
import { useTranslations } from 'next-intl';

interface IpersonalReferencesProps {}

const personalReferences = ['reference1', 'reference2', 'reference3'];

const PersonalReferences: FC<IpersonalReferencesProps> = ({}) => {
  const t = useTranslations('curriculum');
  return (
    <>
      <h5 className="text-blue mb-1 mt-2 flex items-center gap-1 border-t-2 pt-2 text-xs font-semibold">
        <MdOutlineGroups3 className="text-black" />
        {t('header.personalReferences')}
      </h5>

      <div>
        {personalReferences.map((item) => (
          <div className="flex text-xs" key={item}>
            <p className="mr-1">-</p>
            <p className="m-0">
              {t(`personalReferences.${item}.name` as any)} - {t(`personalReferences.${item}.role` as any)} -{' '} {t("telephone")}
              {t(`personalReferences.${item}.phoneNumber` as any)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
};

export default PersonalReferences;
