import type { Locale } from "@/i18n/config";
import { api } from "@/trpc/server";
import { LIMIT_PER_PAGE_BIG } from "@/utils/constants";
import { ProjectsCatalogView } from "@/features/projects/components/projects-catalog-view";
import { ProjectsCatalogClient } from "@/features/projects/components/projects-catalog-client";
import { Suspense } from "react";

export { generateMetadata } from "./metadata";

interface ProjectsPageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { locale } = await params;

  const data = await api.portfolio.getProjects({
    limit: LIMIT_PER_PAGE_BIG,
    locale,
  });

  return (
    <div className="bg-background min-h-screen">
      <Suspense
        fallback={<ProjectsCatalogView initialProjects={data.projects} />}
      >
        <ProjectsCatalogClient projects={data.projects} />
      </Suspense>
    </div>
  );
}
