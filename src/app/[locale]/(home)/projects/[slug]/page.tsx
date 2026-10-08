import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

export { generateMetadata } from "./metadata";

import ProjectCaseStudyView from "@/features/home/components/projects/project-case-study-view";
import { locales, type Locale } from "@/i18n/config";
import { api } from "@/trpc/server";

interface ProjectCaseStudyPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export default async function ProjectCaseStudyPage({
  params,
}: ProjectCaseStudyPageProps) {
  const { slug, locale } = await params;
  const activeLocale = locales.includes(locale)
    ? locale
    : ((await getLocale()));

  const [project, nextProject] = await Promise.all([
    api.portfolio.getProjectBySlug({
      slug,
      locale: activeLocale,
    }),
    api.portfolio.getNextCaseStudyProject({
      slug,
      locale: activeLocale,
    }),
  ]);

  if (!project) notFound();

  return <ProjectCaseStudyView project={project} nextProject={nextProject} />;
}
