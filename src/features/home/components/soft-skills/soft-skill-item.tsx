import { type FunctionComponent, type SVGAttributes } from "react";
import type { FC } from "react";

import { cn } from "@/lib/utils";

interface ISoftSkillItemProps {
  title: string;
  description: string;
  icon: FunctionComponent<SVGAttributes<SVGElement>>;
  isActive?: boolean;
}

const SoftSkillItem: FC<ISoftSkillItemProps> = ({
  title,
  description,
  icon: Icon,
  isActive = false,
}) => {
  return (
    <div className="flex max-w-[11rem] flex-col items-center gap-2">
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full border-2 backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isActive
            ? "border-primary bg-primary/20 shadow-[0_0_28px_color-mix(in_oklch,var(--primary)_40%,transparent)]"
            : "border-white/35 bg-black/35",
        )}
      >
        <Icon
          className={cn(
            "h-9 w-9 transition-colors duration-500",
            isActive ? "text-primary" : "text-white/85",
          )}
        />
      </div>
      <p className="text-center text-sm font-medium text-white antialiased select-none">
        {title}
      </p>
      <p
        className={cn(
          "min-h-[2.75rem] text-center text-xs leading-snug text-white/80 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isActive
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        {description}
      </p>
    </div>
  );
};

export default SoftSkillItem;
