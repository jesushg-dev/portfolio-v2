export { generateMetadata } from "./metadata";
import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { UsesAdminPanel } from "@/features/uses/components/admin/uses-admin-panel";
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
  setRequestLocale(locale as Locale);

  const tabParam = typeof search.tab === "string" ? search.tab : "EVERYDAY";
  const initialTab =
    tabParam === "SOFTWARE" ||
    tabParam === "BROWSER" ||
    tabParam === "SETTINGS" ||
    tabParam === "EVERYDAY"
      ? tabParam
      : "EVERYDAY";

  const [t, everyday, software, browser, settingsPage] = await Promise.all([
    getTranslations("admin.uses"),
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
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
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
      />
    </div>
  );
};

export default UsesAdminPage;
