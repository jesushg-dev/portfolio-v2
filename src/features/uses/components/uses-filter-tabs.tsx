"use client";

import type { FC } from "react";
import { Code, Eye, Globe, Layers, Monitor } from "lucide-react";

import Tab from "@/components/custom-ui/custom-tab";
import TabItem from "@/components/custom-ui/custom-tab/tab-item";

export const USES_FILTER = {
  all: 0,
  everyday: 1,
  software: 2,
  browser: 3,
  coding: 4,
} as const;

export type UsesFilterValue = (typeof USES_FILTER)[keyof typeof USES_FILTER];

interface UsesFilterTabsProps {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  labels: {
    all: string;
    everyday: string;
    software: string;
    browser: string;
    coding: string;
  };
}

const UsesFilterTabs: FC<UsesFilterTabsProps> = ({
  value,
  onChange,
  ariaLabel,
  labels,
}) => {
  return (
    <div className="mb-2 flex w-full justify-center px-2 sm:px-0">
      <Tab
        tabId="uses-filter"
        currentTab={value}
        setCurrentTab={onChange}
        ariaLabel={ariaLabel}
        className="z-20 max-w-full"
      >
        <TabItem icon={Eye} title={labels.all} />
        <TabItem icon={Layers} title={labels.everyday} />
        <TabItem icon={Monitor} title={labels.software} />
        <TabItem icon={Globe} title={labels.browser} />
        <TabItem icon={Code} title={labels.coding} />
      </Tab>
    </div>
  );
};

export default UsesFilterTabs;
