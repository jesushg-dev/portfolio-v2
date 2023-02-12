import React, { FC, memo } from 'react';

import { FaEye, FaPager, FaDesktop, FaDatabase, FaMobile } from 'react-icons/fa';

import { useTranslations } from 'next-intl';

interface IProjectType {
  name: string;
  icon: JSX.Element;
  value: ProjectType | undefined;
}

export type ProjectType = 'FRONTEND' | 'BACKEND' | 'MOBILE' | 'DESKTOP';

const TypeArrays: IProjectType[] = [
  {
    name: 'all',
    icon: <FaEye />,
    value: undefined,
  },
  {
    name: 'frontend',
    icon: <FaPager />,
    value: 'FRONTEND',
  },
  {
    name: 'backend',
    icon: <FaDatabase />,
    value: 'BACKEND',
  },
  {
    name: 'mobile',
    icon: <FaMobile />,
    value: 'MOBILE',
  },
  {
    name: 'desktop',
    icon: <FaDesktop />,
    value: 'DESKTOP',
  },
];

interface IFilterTypeProps {
  value: ProjectType | undefined;
  onChange: (value: ProjectType | undefined) => void;
}

const FilterType: FC<IFilterTypeProps> = ({ value, onChange }) => {
  const t = useTranslations('portfolio');

  return (
    <div className="mb-12 flex flex-col items-center justify-center gap-4">
      <ul className="flex w-full flex-wrap justify-center text-center text-sm font-medium text-secondaryText-500">
        {TypeArrays.map((type) => (
          <li className="mr-2" key={type.name}>
            <button
              type="button"
              onClick={() => onChange(type.value)}
              className={`${
                value === type.value
                  ? 'active bg-primary-600 text-neutralText-50'
                  : 'hover:text-secondaryText-90 hover:bg-background-100'
              } inline-flex items-center gap-2 rounded-lg px-4 py-3 font-bold`}>
              {type.icon} {t(`filters.${type.name}` as any)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const areEqual = (prevProps: IFilterTypeProps, nextProps: IFilterTypeProps) => {
  return prevProps.value === nextProps.value;
};

export default memo(FilterType, areEqual);
