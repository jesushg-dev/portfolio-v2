export { generateMetadata } from "./metadata";
import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { ProcessPagesList } from "@/features/process-pages/components/admin/process-pages-list";
import { getUserProcessPagesWithLanguages } from "@/features/process-pages/server/process-pages-queries";

interface Props {
  params: Promise<{ locale: string }>;
}

const ProcessPagesAdminPage: FC<Props> = async ({ params }) => {
  const { locale } = await params;

  const [t, list] = await Promise.all([
    getTranslations({
      locale: locale as Locale,
      namespace: "admin.processPages",
    }),
    getUserProcessPagesWithLanguages({
      page: 1,
      perPage: 50,
      sort: [],
      filters: [],
    }),
  ]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0">
        <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <ProcessPagesList
        initialPages={list.data}
        pageCount={list.pageCount}
        totalCount={list.totalCount}
        languages={list.languages}
      />
    </div>
  );
};

export default ProcessPagesAdminPage;
