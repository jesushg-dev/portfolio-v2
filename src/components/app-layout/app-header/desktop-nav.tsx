"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { NAV_GROUPS } from "./navigation-config";
import { DesktopNavTrigger } from "./nav-menu-parts";

interface DesktopNavProps {
  activeGroup: (typeof NAV_GROUPS)[number]["id"] | null;
  onActiveGroupChange: (
    groupId: (typeof NAV_GROUPS)[number]["id"] | null,
  ) => void;
  className?: string;
}

const DesktopNav: FC<DesktopNavProps> = ({
  activeGroup,
  onActiveGroupChange,
  className,
}) => {
  const tGroups = useTranslations("global.header.nav.groups");

  return (
    <div className={cn("hidden items-center gap-0.5 lg:flex", className)}>
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
