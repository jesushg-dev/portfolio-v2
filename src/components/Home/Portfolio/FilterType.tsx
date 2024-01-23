import type { FC } from "react";
import React, { memo } from "react";
import { FaEye, FaDesktop, FaDatabase, FaMobile } from "react-icons/fa";
import { useTranslations } from "next-intl";

import Tab from "@/components/UI/Tab";
import TabItem from "@/components/UI/Tab/TabItem";

interface IFilterTypeProps {
  value: number;
  onChange: (value: number) => void;
}

const FilterType: FC<IFilterTypeProps> = ({ value, onChange }) => {
  const t = useTranslations("main.portfolio");

  return (
    <div className="mb-12 flex w-full items-center justify-center">
      <Tab
        tabId="portfolio-tab"
        minimal
        currentTab={value}
        setCurrentTab={onChange}
        className="flex items-center gap-4 overflow-x-auto"
      >
        <TabItem icon={FaEye} title={t("filters.all")} description="" />
        <TabItem
          icon={FaDesktop}
          title={t("filters.frontend")}
          description=""
        />
        <TabItem
          icon={FaDatabase}
          title={t("filters.backend")}
          description=""
        />
        <TabItem icon={FaMobile} title={t("filters.mobile")} description="" />
      </Tab>
    </div>
  );
};

const areEqual = (prevProps: IFilterTypeProps, nextProps: IFilterTypeProps) => {
  return prevProps.value === nextProps.value;
};

export default memo(FilterType, areEqual);
