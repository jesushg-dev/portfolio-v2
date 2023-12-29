import type { FC } from 'react';

import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/UI/Tooltip';

interface ISoftSkillItemProps {
  title: string;
  description: string;
  icon: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
}

const SoftSkillItem: FC<ISoftSkillItemProps> = ({ title, description, icon: Icon }) => {
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex max-w-[10rem] flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary-600 transition-all hover:scale-110 hover:border-primary-500">
            <Icon className="h-10 w-10 rounded-full text-slate-100 shadow-lg" />
          </div>
          <p className="ml-1 select-none text-center text-white antialiased">{title}</p>
        </div>
      </TooltipTrigger>
      <TooltipContent className="z-40 max-w-[10rem] rounded bg-black px-4 py-2">
        <p className="pointer-events-none text-center text-sm text-secondaryText-50">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default SoftSkillItem;
