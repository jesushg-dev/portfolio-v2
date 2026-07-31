import { notFound } from "next/navigation";
import { getLocale, setRequestLocale } from "next-intl/server";

export { generateMetadata } from "./metadata";

import ProjectCaseStudyView from "@/features/home/components/projects/project-case-study-view";
import { type Locale, locales } from "@/i18n/config";
import { api } from "@/trpc/server";

interface ProjectCaseStudyPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function ProjectCaseStudyPage({
  params,
}: ProjectCaseStudyPageProps) {
  const { locale, slug } = await params;

  if ((locales as readonly string[]).includes(locale)) {
    setRequestLocale(locale as Locale);
  }

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
