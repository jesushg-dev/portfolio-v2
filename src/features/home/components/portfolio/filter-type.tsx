import type { FC } from "react";
import { memo } from "react";
import { Eye, Monitor, Server, Smartphone, Laptop } from "lucide-react";
import { useTranslations } from "next-intl";

import Tab from "@/components/custom-ui/custom-tab";
import TabItem from "@/components/custom-ui/custom-tab/tab-item";

interface IFilterTypeProps {
  value: number;
  onChange: (value: number) => void;
  counts?: number[];
}

const FilterType: FC<IFilterTypeProps> = ({ value, onChange, counts }) => {
  const t = useTranslations("main.portfolio");

  const titles = [
    t("filters.all"),
    t("filters.frontend"),
    t("filters.backend"),
    t("filters.mobile"),
    t("filters.desktop"),
  ];

  return (
    <div className="mb-10 flex w-full justify-center px-2 sm:px-4">
      <Tab
        tabId="portfolio-tab"
        minimal
        currentTab={value}
        setCurrentTab={onChange}
        ariaLabel={t("filters.ariaLabel")}
        className="bg-muted/70 border-border text-foreground inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-3xl border p-1.5 shadow-xs md:rounded-full"
      >
        <TabItem
          icon={Eye}
          title={
            typeof counts?.[0] === "number"
              ? `${titles[0]} (${counts[0]})`
              : titles[0]
          }
          description=""
        />
        <TabItem
          icon={Monitor}
          title={
            typeof counts?.[1] === "number"
              ? `${titles[1]} (${counts[1]})`
              : titles[1]
          }
          description=""
        />
        <TabItem
          icon={Server}
          title={
            typeof counts?.[2] === "number"
              ? `${titles[2]} (${counts[2]})`
              : titles[2]
          }
          description=""
        />
        <TabItem
          icon={Smartphone}
          title={
            typeof counts?.[3] === "number"
              ? `${titles[3]} (${counts[3]})`
              : titles[3]
          }
          description=""
        />
        <TabItem
          icon={Laptop}
          title={
            typeof counts?.[4] === "number"
              ? `${titles[4]} (${counts[4]})`
              : titles[4]
          }
          description=""
        />
      </Tab>
    </div>
  );
};

const areEqual = (prevProps: IFilterTypeProps, nextProps: IFilterTypeProps) => {
  return (
    prevProps.value === nextProps.value &&
    JSON.stringify(prevProps.counts) === JSON.stringify(nextProps.counts)
  );
};

export default memo(FilterType, areEqual);
