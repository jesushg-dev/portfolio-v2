export { generateMetadata } from "./metadata";
import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { SoftSkillsList } from "@/features/soft-skills/components/soft-skills-list";
import { getUserSoftSkillsWithLanguages } from "@/features/soft-skills/server/soft-skill-queries";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const SoftSkillsAdminPage: FC<Props> = async ({ params, searchParams }) => {
  const [{ locale }, search] = await Promise.all([params, searchParams]);

  const page = typeof search.page === "string" ? parseInt(search.page) || 1 : 1;
  const perPage =
    typeof search.perPage === "string" ? parseInt(search.perPage) || 10 : 10;

  const [t, { data: initialItems, languages, pageCount, totalCount }] =
    await Promise.all([
      getTranslations("admin.softSkills"),
      getUserSoftSkillsWithLanguages({ page, perPage, sort: [], filters: [] }),
    ]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="min-h-0 flex-1">
        <SoftSkillsList
          initialItems={initialItems}
          languages={languages}
          locale={locale as Locale}
          pageCount={pageCount}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
};

export default SoftSkillsAdminPage;
