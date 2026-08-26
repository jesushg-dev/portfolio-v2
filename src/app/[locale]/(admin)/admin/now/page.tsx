export { generateMetadata } from "./metadata";
import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  NowAdminPanel,
  type NowTab,
} from "@/features/now/components/admin/now-admin-panel";
import { getNowAdminPageData } from "@/features/now/server/now-queries";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const NowAdminPage: FC<Props> = async ({ params, searchParams }) => {
  const [{ locale }, search] = await Promise.all([params, searchParams]);
  setRequestLocale(locale as Locale);

  const tabParam = typeof search.tab === "string" ? search.tab : "SNAPSHOT";
  const initialTab: NowTab =
    tabParam === "ACTIVITY" ||
    tabParam === "GITHUB" ||
    tabParam === "FOCUSES" ||
    tabParam === "SNAPSHOT"
      ? tabParam
      : "SNAPSHOT";

  const [t, { settings, focuses, languages }] = await Promise.all([
    getTranslations("admin.now"),
    getNowAdminPageData(),
  ]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <NowAdminPanel
        initialTab={initialTab}
        settings={settings}
        focuses={focuses}
        languages={languages}
      />
    </div>
  );
};

export default NowAdminPage;
