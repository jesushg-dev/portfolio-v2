"use client";

import { useMemo, type FC } from "react";
import type { AppLanguage, UsesItemType } from "@prisma/client";
import { useTranslations } from "next-intl";
import { parseAsStringEnum, useQueryState } from "nuqs";
import {
  HiOutlineCog,
  HiOutlineCollection,
  HiOutlineDesktopComputer,
  HiOutlineGlobe,
} from "react-icons/hi";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsesItemsList } from "@/features/uses/components/admin/uses-items-list";
import { UsesSettingsForm } from "@/features/uses/components/admin/uses-settings-form";
import type {
  UsesItemEditorDTO,
  UsesSettingsEditorDTO,
} from "@/features/uses/lib/uses-editor-dto";
import type { RouterOutputs } from "@/trpc/react";

type UsesItemRow = RouterOutputs["usesAdmin"]["getMine"]["data"][number];

type UsesTab = "EVERYDAY" | "SOFTWARE" | "BROWSER" | "SETTINGS";

interface UsesAdminPanelProps {
  initialTab: UsesTab;
  lists: Record<
    UsesItemType,
    { data: UsesItemRow[]; pageCount: number; totalCount: number }
  >;
  settings: UsesSettingsEditorDTO;
  languages: AppLanguage[];
  taggableItems: UsesItemEditorDTO[];
}

const TAB_TYPES: UsesTab[] = ["EVERYDAY", "SOFTWARE", "BROWSER", "SETTINGS"];

export const UsesAdminPanel: FC<UsesAdminPanelProps> = ({
  initialTab,
  lists,
  settings,
  languages,
  taggableItems,
}) => {
  const t = useTranslations("admin.uses");
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringEnum(TAB_TYPES).withDefault(initialTab),
  );

  const currentTab = useMemo(() => tab ?? initialTab, [tab, initialTab]);

  return (
    <Tabs
      value={currentTab}
      onValueChange={(value) => {
        void setTab((value as UsesTab) ?? "EVERYDAY");
      }}
      className="flex min-h-0 flex-1 flex-col gap-6"
    >
      <TabsList aria-label={t("tabsLabel")}>
        <TabsTrigger value="EVERYDAY" className="gap-1.5">
          <HiOutlineCollection className="size-4" />
          {t("tabs.everyday")}
        </TabsTrigger>
        <TabsTrigger value="SOFTWARE" className="gap-1.5">
          <HiOutlineDesktopComputer className="size-4" />
          {t("tabs.software")}
        </TabsTrigger>
        <TabsTrigger value="BROWSER" className="gap-1.5">
          <HiOutlineGlobe className="size-4" />
          {t("tabs.browser")}
        </TabsTrigger>
        <TabsTrigger value="SETTINGS" className="gap-1.5">
          <HiOutlineCog className="size-4" />
          {t("tabs.settings")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="EVERYDAY" className="min-h-0 flex-1">
        <UsesItemsList
          type="EVERYDAY"
          initialItems={lists.EVERYDAY.data}
          pageCount={lists.EVERYDAY.pageCount}
          totalCount={lists.EVERYDAY.totalCount}
        />
      </TabsContent>
      <TabsContent value="SOFTWARE" className="min-h-0 flex-1">
        <UsesItemsList
          type="SOFTWARE"
          initialItems={lists.SOFTWARE.data}
          pageCount={lists.SOFTWARE.pageCount}
          totalCount={lists.SOFTWARE.totalCount}
        />
      </TabsContent>
      <TabsContent value="BROWSER" className="min-h-0 flex-1">
        <UsesItemsList
          type="BROWSER"
          initialItems={lists.BROWSER.data}
          pageCount={lists.BROWSER.pageCount}
          totalCount={lists.BROWSER.totalCount}
        />
      </TabsContent>
      <TabsContent value="SETTINGS" className="min-h-0 flex-1">
        <UsesSettingsForm
          initialData={settings}
          languages={languages}
          taggableItems={taggableItems}
        />
      </TabsContent>
    </Tabs>
  );
};
