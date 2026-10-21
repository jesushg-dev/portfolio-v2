"use client";

import type { FC } from "react";
import {
  HiOutlineCode,
  HiOutlineCollection,
  HiOutlineDesktopComputer,
  HiOutlineEye,
  HiOutlineGlobe,
} from "react-icons/hi";

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
        minimal
        currentTab={value}
        setCurrentTab={onChange}
        ariaLabel={ariaLabel}
        className="bg-muted/50 border-border z-20 inline-flex max-w-full items-center justify-center gap-1 rounded-2xl border p-1"
      >
        <TabItem icon={HiOutlineEye} title={labels.all} description="" />
        <TabItem
          icon={HiOutlineCollection}
          title={labels.everyday}
          description=""
        />
        <TabItem
          icon={HiOutlineDesktopComputer}
          title={labels.software}
          description=""
        />
        <TabItem icon={HiOutlineGlobe} title={labels.browser} description="" />
        <TabItem icon={HiOutlineCode} title={labels.coding} description="" />
      </Tab>
    </div>
  );
};

export default UsesFilterTabs;
