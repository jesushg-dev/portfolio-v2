import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

export { generateMetadata } from "./metadata";

import ProjectCaseStudyView from "@/features/home/components/projects/project-case-study-view";
import { api } from "@/trpc/server";

interface ProjectCaseStudyPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectCaseStudyPage({
  params,
}: ProjectCaseStudyPageProps) {
  const { slug } = await params;

  const activeLocale = await getLocale();
  const project = await api.portfolio.getProjectBySlug({
    slug,
    locale: activeLocale,
  });

  if (!project) notFound();

  const nextProject = await api.portfolio.getNextCaseStudyProject({
    slug,
    locale: activeLocale,
  });

  return <ProjectCaseStudyView project={project} nextProject={nextProject} />;
}
