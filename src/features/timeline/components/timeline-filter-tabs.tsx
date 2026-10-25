"use client";

import { useCallback, type FC } from "react";
import { Briefcase, Eye, GraduationCap } from "lucide-react";

import Tab from "@/components/custom-ui/custom-tab";
import TabItem from "@/components/custom-ui/custom-tab/tab-item";

export type TimelineFilter = "all" | "work" | "learning";

export interface TimelineFilterTabsProps {
  currentFilter: TimelineFilter;
  counts: Record<TimelineFilter, number>;
  onSelect: (filter: TimelineFilter) => void;
  labels: {
    all: string;
    work: string;
    learning: string;
    ariaLabel: string;
  };
}

const FILTER_KEYS: TimelineFilter[] = ["all", "work", "learning"];

export const TimelineFilterTabs: FC<TimelineFilterTabsProps> = ({
  currentFilter,
  counts,
  onSelect,
  labels,
}) => {
  const currentIndex = Math.max(0, FILTER_KEYS.indexOf(currentFilter));

  const handleTabChange = useCallback(
    (index: number) => {
      const selected = FILTER_KEYS[index] ?? "all";
      onSelect(selected);
    },
    [onSelect],
  );

  return (
    <div className="flex w-full justify-start">
      <Tab
        tabId="timeline-filter-tab"
        currentTab={currentIndex}
        setCurrentTab={handleTabChange}
        ariaLabel={labels.ariaLabel}
        className="max-w-full justify-start"
      >
        <TabItem icon={Eye} title={`${labels.all} (${counts.all})`} />
        <TabItem icon={Briefcase} title={`${labels.work} (${counts.work})`} />
        <TabItem
          icon={GraduationCap}
          title={`${labels.learning} (${counts.learning})`}
        />
      </Tab>
    </div>
  );
};
