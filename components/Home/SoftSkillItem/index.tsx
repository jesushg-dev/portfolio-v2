import React, { FC } from 'react';

import Tooltip from '../../Common/Tooltip';

interface ISoftSkillItemProps {
  title: string;
  description: string;
  icon: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
}

const SoftSkillItem: FC<ISoftSkillItemProps> = ({ title, description, icon: Icon }) => {
  return (
    <div className="flex shrink-0 snap-center scroll-pl-6 flex-col items-center gap-4 p-4 px-6">
      <Tooltip text={description} className="-top-14 w-72">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-blue-600 transition-all hover:scale-110 hover:border-blue-500">
          <Icon className="h-10 w-10 rounded-full shadow-lg " />
        </div>
      </Tooltip>
      <p className="ml-1 select-none text-white antialiased">{title}</p>
    </div>
  );
};

export default SoftSkillItem;
