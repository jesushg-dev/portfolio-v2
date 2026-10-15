import type { Locale } from "@/i18n/config";
import { api } from "@/trpc/server";
import { LIMIT_PER_PAGE_BIG } from "@/utils/constants";
import { ProjectsCatalogView } from "@/features/projects/components/projects-catalog-view";

export { generateMetadata } from "./metadata";

interface ProjectsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProjectsPage({
  params,
  searchParams,
}: ProjectsPageProps) {
  const { locale } = await params;
  const search = await searchParams;

  const data = await api.portfolio.getProjects({
    limit: LIMIT_PER_PAGE_BIG,
    locale,
  });

  return (
    <div className="bg-background min-h-screen">
      <ProjectsCatalogView
        initialProjects={data.projects}
        initialSearchParams={search}
      />
    </div>
  );
}
