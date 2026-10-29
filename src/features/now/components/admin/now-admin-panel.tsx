"use client";

import type { AppLanguage } from "@prisma/client";
import { type FC, useMemo } from "react";
import { useTranslations } from "next-intl";
import { parseAsStringEnum, useQueryState } from "nuqs";
import {
  HiOutlineBookOpen,
  HiOutlineCollection,
  HiOutlineStatusOnline,
} from "react-icons/hi";
import { FaGithub } from "react-icons/fa";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NowSettingsEditorDTO } from "@/features/now/lib/now-editor-dto";
import type { NowFocusEditorDTO } from "@/features/now/lib/now-editor-dto";
import { NowFocusesList } from "@/features/now/components/admin/now-focuses-list";
import { NowSettingsForm } from "@/features/now/components/admin/now-settings-form";

type NowTab = "SNAPSHOT" | "ACTIVITY" | "GITHUB" | "FOCUSES";

const TAB_TYPES: NowTab[] = ["SNAPSHOT", "ACTIVITY", "GITHUB", "FOCUSES"];

interface NowAdminPanelProps {
  initialTab: NowTab;
  languages: AppLanguage[];
  settings: NowSettingsEditorDTO;
  focuses: NowFocusEditorDTO[];
}

export const NowAdminPanel: FC<NowAdminPanelProps> = ({
  initialTab,
  languages,
  settings,
  focuses,
}) => {
  const t = useTranslations("admin.now");

  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringEnum(TAB_TYPES).withDefault(initialTab),
  );
  const currentTab = useMemo(() => tab ?? initialTab, [tab, initialTab]);

  return (
    <Tabs
      value={currentTab}
      onValueChange={(value) => {
        void setTab((value as NowTab) ?? "SNAPSHOT");
      }}
      className="border-border bg-card flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col gap-0 rounded-xl border shadow-sm"
    >
      <div className="border-border bg-muted/30 min-w-0 overflow-hidden rounded-t-xl border-b px-3">
        <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
          <TabsList
            variant="line"
            aria-label={t("tabsLabel")}
            className="w-max min-w-full"
          >
            <TabsTrigger value="SNAPSHOT" className="gap-1.5">
              <HiOutlineStatusOnline className="size-4" />
              {t("tabs.snapshot")}
            </TabsTrigger>
            <TabsTrigger value="ACTIVITY" className="gap-1.5">
              <HiOutlineBookOpen className="size-4" />
              {t("tabs.activity")}
            </TabsTrigger>
            <TabsTrigger value="GITHUB" className="gap-1.5">
              <FaGithub className="size-4" />
              {t("tabs.github")}
            </TabsTrigger>
            <TabsTrigger value="FOCUSES" className="gap-1.5">
              <HiOutlineCollection className="size-4" />
              {t("tabs.focuses")}
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 p-4 sm:p-6">
        {currentTab === "FOCUSES" ? (
          <TabsContent value="FOCUSES" className="min-h-0 flex-1">
            <NowFocusesList initialFocuses={focuses} languages={languages} />
          </TabsContent>
        ) : (
          <NowSettingsForm
            currentTab={currentTab}
            languages={languages}
            settings={settings}
            snapshotHint={t("sections.snapshotHint")}
            activityHint={t("sections.activityHint")}
            githubHint={t("sections.githubHint")}
          />
        )}
      </div>
    </Tabs>
  );
};

export type { NowTab };
