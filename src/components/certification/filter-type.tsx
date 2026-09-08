import type { FC } from "react";
import { useTranslations } from "next-intl";
import { MdOutlineSecurity } from "react-icons/md";
import {
  HiOutlineUserGroup,
  HiOutlineEye,
  HiOutlineDesktopComputer,
  HiOutlineDatabase,
} from "react-icons/hi";

import Tab from "@/components/custom-ui/custom-tab";
import TabItem from "@/components/custom-ui/custom-tab/tab-item";

// types

interface IFilterTypeProps {
  value: number;
  onChange: (value: number) => void;
}

const FilterType: FC<IFilterTypeProps> = ({ value, onChange }) => {
  const t = useTranslations("certification");

  return (
    <div className="mb-14 flex w-full justify-center px-2 sm:px-4">
      <Tab
        minimal
        currentTab={value}
        setCurrentTab={onChange}
        ariaLabel={t("types.filtersAriaLabel")}
        className="bg-muted/50 border-border z-20 inline-flex max-w-full items-center justify-center gap-1 rounded-2xl border p-1"
      >
        <TabItem
          icon={HiOutlineEye}
          title={t("types.all.title")}
          description={t("types.all.subtitle")}
        />
        <TabItem
          icon={HiOutlineDesktopComputer}
          title={t("types.frontend.title")}
          description={t("types.frontend.subtitle")}
        />
        <TabItem
          icon={HiOutlineDatabase}
          title={t("types.backend.title")}
          description={t("types.backend.subtitle")}
        />
        {/** <TabItem icon={HiOutlineDeviceMobile} title={t('types.mobile.title')} description={t('types.mobile.subtitle')} /> */}
        <TabItem
          icon={MdOutlineSecurity}
          title={t("types.cybersecurity.title")}
          description={t("types.cybersecurity.subtitle")}
        />
        <TabItem
          icon={HiOutlineUserGroup}
          title={t("types.softskills.title")}
          description={t("types.softskills.subtitle")}
        />
      </Tab>
    </div>
  );
};

export default FilterType;
