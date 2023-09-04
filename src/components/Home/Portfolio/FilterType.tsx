import React, { FC, memo } from 'react';

import Tab, { TabItem } from '@/components/UI/Tab';
import { FaEye, FaPager, FaDesktop, FaDatabase, FaMobile } from 'react-icons/fa';

import { useTranslations } from 'next-intl';

interface IFilterTypeProps {
  value: number;
  onChange: (value: number) => void;
}

const FilterType: FC<IFilterTypeProps> = ({ value, onChange }) => {
  const t = useTranslations('main.portfolio');

  return (
    <div className="flex justify-center items-center w-full mb-12">
      <Tab minimal currentTab={value} setCurrentTab={onChange} className="flex gap-4 items-center overflow-x-auto">
        <TabItem icon={FaEye} title={t('filters.all')} description="" />
        <TabItem icon={FaDesktop} title={t('filters.frontend')} description="" />
        <TabItem icon={FaDatabase} title={t('filters.backend')} description="" />
        <TabItem icon={FaMobile} title={t('filters.mobile')} description="" />
      </Tab>
    </div>
  );
};

const areEqual = (prevProps: IFilterTypeProps, nextProps: IFilterTypeProps) => {
  return prevProps.value === nextProps.value;
};

export default memo(FilterType, areEqual);
