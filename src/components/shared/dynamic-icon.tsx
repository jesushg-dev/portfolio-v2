import { createElement, type FC, type SVGProps } from "react";
import { resolveIcon, type IconComponent } from "@/lib/icons/icon-registry";
import { cn } from "@/lib/utils";

export interface DynamicIconProps extends Omit<
  SVGProps<SVGSVGElement>,
  "name"
> {
  name?: string | null;
  fallback?: IconComponent;
  size?: number | string;
}

/**
 * Universal dynamic icon component.
 * Resolves any registered icon key (Lucide or React-Icons) and renders it with accessible defaults.
 */
export const DynamicIcon: FC<DynamicIconProps> = ({
  name,
  fallback,
  className,
  size,
  ...props
}) => {
  const Icon = resolveIcon(name, fallback);

  return createElement(Icon, {
    className: cn("shrink-0", className),
    size,
    "aria-hidden": true,
    ...props,
  });
};

export default DynamicIcon;
