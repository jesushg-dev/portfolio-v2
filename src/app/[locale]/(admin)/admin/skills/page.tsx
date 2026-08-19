export { generateMetadata } from "./metadata";
import type { FC } from "react";
import { getTranslations } from "next-intl/server";

import { SkillsList } from "@/features/skills/components/skills-list";
import { getUserSkillsWithLanguages } from "@/features/skills/server/skill-queries";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const SkillsPage: FC<Props> = async ({ searchParams }) => {
  const search = await searchParams;

  const page = typeof search.page === "string" ? parseInt(search.page) || 1 : 1;
  const perPage =
    typeof search.perPage === "string" ? parseInt(search.perPage) || 10 : 10;

  const [t, { data: initialSkills, pageCount, totalCount }] = await Promise.all(
    [
      getTranslations("admin.skills"),
      getUserSkillsWithLanguages({ page, perPage, sort: [], filters: [] }),
    ],
  );

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="min-h-0 flex-1">
        <SkillsList
          initialSkills={initialSkills}
          pageCount={pageCount}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
};

export default SkillsPage;
