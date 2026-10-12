import type { FC } from "react";
import type { Locale } from "@/i18n/config";
import type { ProjectType } from "@/utils/interfaces/types";
import { api } from "@/trpc/server";
import { LIMIT_PER_PAGE_BIG } from "@/utils/constants";
import { ProjectsCatalogView } from "@/features/projects/components/projects-catalog-view";

export { generateMetadata } from "./metadata";

interface ProjectsPageProps {
  params: Promise<{ locale: Locale }>;
}

const ProjectsPage: FC<ProjectsPageProps> = async ({ params }) => {
  const { locale } = await params;

  let initialProjects: {
    projects: ProjectType[];
    nextCursor: string | null;
    totalCount: number;
    caseStudyCount: number;
  } = {
    projects: [],
    nextCursor: null,
    totalCount: 0,
    caseStudyCount: 0,
  };

  try {
    const data = await api.portfolio.getProjects({
      limit: LIMIT_PER_PAGE_BIG,
      locale,
    });
    initialProjects = data;
  } catch (error) {
    console.error("Failed to load projects catalog:", error);
  }

  return (
    <div className="bg-background min-h-screen">
      <ProjectsCatalogView initialProjects={initialProjects.projects} />
    </div>
  );
};

export default ProjectsPage;
