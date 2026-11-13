import { getPublicLocale } from "@/lib/public-site/locale";
import { notFound } from "next/navigation";

export { generateMetadata } from "./metadata";
export { publicProjectParams as generateStaticParams } from "@/lib/public-site/static-params";

import ProjectCaseStudyView from "@/features/home/components/projects/project-case-study-view";
import { locales, type Locale } from "@/i18n/config";
import { api } from "@/trpc/server";
import { SITE_URL } from "@/lib/seo/site";

interface ProjectCaseStudyPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export default async function ProjectCaseStudyPage({
  params,
}: ProjectCaseStudyPageProps) {
  const { slug, locale } = await params;
  const activeLocale = locales.includes(locale)
    ? locale
    : await getPublicLocale();

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

  const projectUrl = `${SITE_URL}/projects/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${projectUrl}#project`,
        name: project.title,
        description: project.description,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        image: project.image ? [project.image] : undefined,
        author: {
          "@type": "Person",
          name: "Jesús Hernández",
          url: SITE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${projectUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Projects",
            item: `${SITE_URL}/projects`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: project.title,
            item: projectUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProjectCaseStudyView project={project} nextProject={nextProject} />
    </>
  );
}
