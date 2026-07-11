import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProjectsList } from "@/features/projects/components/projects-list";
import { getUserProjectsWithLanguages } from "@/features/projects/server/project-queries";

interface Props {
  params: Promise<{ locale: string }>;
}

const ProjectsPage: FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const [t, { data: initialProjects, languages }] = await Promise.all([
    getTranslations("admin.projects"),
    getUserProjectsWithLanguages(),
  ]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="min-h-0 flex-1">
        <ProjectsList
          initialProjects={initialProjects}
          languages={languages}
          locale={locale as Locale}
        />
      </div>
    </div>
  );
};

export default ProjectsPage;
