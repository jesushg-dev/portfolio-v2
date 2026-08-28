"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineCode,
} from "react-icons/hi";
import type { IconType } from "react-icons/lib";

import Tab from "@/components/custom-ui/custom-tab";
import TabItem from "@/components/custom-ui/custom-tab/tab-item";

export interface SkillModalTab {
  id: string;
  label: string;
  count: number;
  hint: string;
  content: ReactNode;
}

interface SkillModalTabsProps {
  tabs: SkillModalTab[];
}

const TAB_ICONS: Record<string, IconType> = {
  certificates: HiOutlineAcademicCap,
  experiences: HiOutlineBriefcase,
  projects: HiOutlineCode,
};

export function SkillModalTabs({ tabs }: SkillModalTabsProps) {
  const t = useTranslations("main.skills.modal");
  const [currentTab, setCurrentTab] = useState(0);

  if (tabs.length === 0) return null;

  const activeTab = tabs[currentTab] ?? tabs[0];
  const panelId = `skill-modal-panel-${activeTab?.id ?? "0"}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <Tab
        tabId="skill-modal"
        minimal
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        ariaLabel={t("tabsAriaLabel")}
        className="bg-muted/50 border-border z-20 inline-flex w-full max-w-full shrink-0 items-center justify-center gap-1 overflow-x-auto overflow-y-hidden rounded-2xl border p-1"
      >
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            icon={TAB_ICONS[tab.id] ?? HiOutlineCode}
            title={`${tab.label} (${tab.count})`}
            description=""
          />
        ))}
      </Tab>

      {activeTab ? (
        <p className="text-muted-foreground shrink-0 text-xs leading-snug">
          {activeTab.hint}
        </p>
      ) : null}

      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={`skill-modal-tab-${currentTab}`}
        className="themed-scrollbar min-h-0 flex-1 overflow-y-auto pr-1"
      >
        {activeTab?.content}
      </div>
    </div>
  );
}
