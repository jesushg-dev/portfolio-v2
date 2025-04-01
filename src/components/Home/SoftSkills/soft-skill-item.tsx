import type { FC } from "react";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/custom-ui/Tooltip";

interface ISoftSkillItemProps {
  title: string;
  description: string;
  icon: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
}

const SoftSkillItem: FC<ISoftSkillItemProps> = ({
  title,
  description,
  icon: Icon,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex max-w-[10rem] flex-col items-center">
          <div className="border-primary-600 hover:border-primary-500 flex h-16 w-16 items-center justify-center rounded-full border-4 transition-all hover:scale-110">
            <Icon className="h-10 w-10 rounded-full text-slate-100 shadow-lg" />
          </div>
          <p className="ml-1 text-center text-white antialiased select-none">
            {title}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent className="rounded-smbg-black z-40 max-w-[10rem] px-4 py-2">
        <p className="text-secondaryText-50 pointer-events-none text-center text-sm">
          {description}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export default SoftSkillItem;
