"use client";

import { useMemo, type FC } from "react";
import type { AppLanguage, UsesItemType } from "@prisma/client";
import { useTranslations } from "next-intl";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { Globe, Layers, Monitor, Settings } from "lucide-react";

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
      <TabsList
        variant="line"
        aria-label={t("tabsLabel")}
        className="border-border/70 w-full justify-start overflow-x-auto overflow-y-hidden border-b"
      >
        <TabsTrigger value="EVERYDAY" className="gap-2">
          <Layers className="size-4" />
          <span>{t("tabs.everyday")}</span>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
            {lists.EVERYDAY.totalCount}
          </span>
        </TabsTrigger>
        <TabsTrigger value="SOFTWARE" className="gap-2">
          <Monitor className="size-4" />
          <span>{t("tabs.software")}</span>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
            {lists.SOFTWARE.totalCount}
          </span>
        </TabsTrigger>
        <TabsTrigger value="BROWSER" className="gap-2">
          <Globe className="size-4" />
          <span>{t("tabs.browser")}</span>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
            {lists.BROWSER.totalCount}
          </span>
        </TabsTrigger>
        <TabsTrigger value="SETTINGS" className="gap-1.5">
          <Settings className="size-4" />
          <span>{t("tabs.settings")}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="EVERYDAY" className="min-h-0 flex-1">
        <UsesItemsList
          type="EVERYDAY"
          initialItems={lists.EVERYDAY.data}
          pageCount={lists.EVERYDAY.pageCount}
          totalCount={lists.EVERYDAY.totalCount}
          languages={languages}
        />
      </TabsContent>
      <TabsContent value="SOFTWARE" className="min-h-0 flex-1">
        <UsesItemsList
          type="SOFTWARE"
          initialItems={lists.SOFTWARE.data}
          pageCount={lists.SOFTWARE.pageCount}
          totalCount={lists.SOFTWARE.totalCount}
          languages={languages}
        />
      </TabsContent>
      <TabsContent value="BROWSER" className="min-h-0 flex-1">
        <UsesItemsList
          type="BROWSER"
          initialItems={lists.BROWSER.data}
          pageCount={lists.BROWSER.pageCount}
          totalCount={lists.BROWSER.totalCount}
          languages={languages}
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
