"use client";

import type { FC } from "react";
import { useState } from "react";

import { NAV_GROUPS } from "./navigation-config";
import { MobileContactActions, MobileNavGroup } from "./nav-menu-parts";

interface MobileNavProps {
  isOpen: boolean;
}

const MobileNav: FC<MobileNavProps> = ({ isOpen }) => {
  const [openGroup, setOpenGroup] = useState<
    (typeof NAV_GROUPS)[number]["id"] | null
  >("about");

  if (!isOpen) return null;

  const toggleGroup = (groupId: (typeof NAV_GROUPS)[number]["id"]) => {
    setOpenGroup((current) => (current === groupId ? null : groupId));
  };

  return (
    <div className="border-border/60 bg-background/95 mt-3 w-full rounded-2xl border p-4 shadow-lg ring-1 ring-black/5 backdrop-blur-xl lg:hidden">
      {NAV_GROUPS.map((group) => (
        <MobileNavGroup
          key={group.id}
          groupId={group.id}
          isOpen={openGroup === group.id}
          onToggle={() => toggleGroup(group.id)}
        />
      ))}
      <MobileContactActions />
    </div>
  );
};

export default MobileNav;
