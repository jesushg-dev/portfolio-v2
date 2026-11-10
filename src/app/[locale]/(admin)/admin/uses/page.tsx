export { generateMetadata } from "./metadata";
import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { UsesAdminPanel } from "@/features/uses/components/admin/uses-admin-panel";
import { ExportSeedJsonButton } from "@/components/admin/shared/export-seed-json-button";
import {
  getUserUsesItemsWithLanguages,
  getUsesSettingsPageData,
} from "@/features/uses/server/uses-queries";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const UsesAdminPage: FC<Props> = async ({ params, searchParams }) => {
  const [{ locale }, search] = await Promise.all([params, searchParams]);

  const tabParam = typeof search.tab === "string" ? search.tab : "EVERYDAY";
  const initialTab =
    tabParam === "SOFTWARE" ||
    tabParam === "BROWSER" ||
    tabParam === "SETTINGS" ||
    tabParam === "EVERYDAY"
      ? tabParam
      : "EVERYDAY";

  const [t, everyday, software, browser, settingsPage] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "admin.uses" }),
    getUserUsesItemsWithLanguages({
      page: 1,
      perPage: 50,
      sort: [],
      filters: [],
      type: "EVERYDAY",
    }),
    getUserUsesItemsWithLanguages({
      page: 1,
      perPage: 50,
      sort: [],
      filters: [],
      type: "SOFTWARE",
    }),
    getUserUsesItemsWithLanguages({
      page: 1,
      perPage: 50,
      sort: [],
      filters: [],
      type: "BROWSER",
    }),
    getUsesSettingsPageData(),
  ]);

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 py-2">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
            {t("subtitle")}
          </p>
        </div>
        <ExportSeedJsonButton entity="uses" />
      </div>
      <UsesAdminPanel
        initialTab={initialTab}
        lists={{
          EVERYDAY: {
            data: everyday.data,
            pageCount: everyday.pageCount,
            totalCount: everyday.totalCount,
          },
          SOFTWARE: {
            data: software.data,
            pageCount: software.pageCount,
            totalCount: software.totalCount,
          },
          BROWSER: {
            data: browser.data,
            pageCount: browser.pageCount,
            totalCount: browser.totalCount,
          },
        }}
        settings={settingsPage.settings}
        languages={settingsPage.languages}
        taggableItems={settingsPage.taggableItems}
      />
    </div>
  );
};

export default UsesAdminPage;
