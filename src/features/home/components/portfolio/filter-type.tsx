import type { FC } from "react";
import { memo } from "react";
import { FaEye, FaDesktop, FaDatabase, FaMobile } from "react-icons/fa";
import { useTranslations } from "next-intl";

import Tab from "@/components/custom-ui/custom-tab";
import TabItem from "@/components/custom-ui/custom-tab/tab-item";

interface IFilterTypeProps {
  value: number;
  onChange: (value: number) => void;
}

const FilterType: FC<IFilterTypeProps> = ({ value, onChange }) => {
  const t = useTranslations("main.portfolio");

  return (
    <div className="mb-12 flex w-full justify-center px-2 sm:px-4">
      <Tab
        tabId="portfolio-tab"
        minimal
        currentTab={value}
        setCurrentTab={onChange}
        ariaLabel={t("filters.ariaLabel")}
        className="bg-muted/50 border-border inline-flex max-w-full snap-x snap-mandatory scrollbar-none items-center justify-center gap-1 overflow-x-auto overscroll-x-contain rounded-2xl border p-1 pb-1 [-ms-overflow-style:none] sm:gap-1.5 [&::-webkit-scrollbar]:hidden"
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
