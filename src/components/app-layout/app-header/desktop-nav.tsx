"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "./navigation-config";
import { headerNavTriggerStyles } from "./toolbar-control-styles";

interface DesktopNavProps {
  activeGroup: (typeof NAV_GROUPS)[number]["id"] | null;
  onActiveGroupChange: (
    groupId: (typeof NAV_GROUPS)[number]["id"] | null,
  ) => void;
  className?: string;
}

interface DesktopNavTriggerProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
}

export const DesktopNavTrigger: FC<DesktopNavTriggerProps> = ({
  label,
  isActive,
  onClick,
  onMouseEnter,
}) => (
  <button
    type="button"
    aria-expanded={isActive}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    className={headerNavTriggerStyles(isActive)}
  >
    <span>{label}</span>
    <ChevronDown
      aria-hidden="true"
      className={cn(
        "size-3 opacity-70 transition-transform duration-200",
        isActive && "rotate-180 opacity-100",
      )}
    />
  </button>
);

export const DesktopNav: FC<DesktopNavProps> = ({
  activeGroup,
  onActiveGroupChange,
  className,
}) => {
  const tGroups = useTranslations("global.header.nav.groups");

  return (
    <div className={cn("hidden items-center gap-1 lg:flex", className)}>
      {NAV_GROUPS.map((group) => (
        <DesktopNavTrigger
          key={group.id}
          label={tGroups(`${group.id}.label`)}
          isActive={activeGroup === group.id}
          onClick={() =>
            onActiveGroupChange(activeGroup === group.id ? null : group.id)
          }
          onMouseEnter={() => onActiveGroupChange(group.id)}
        />
      ))}
    </div>
  );
};

export default DesktopNav;
