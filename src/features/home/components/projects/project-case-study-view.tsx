import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";
import { buildCloudinaryUrl, resolveSkillImageUrl } from "@/utils/tools/image";

interface ProjectCaseStudyViewProps {
  project: {
    slug: string | null;
    image: string;
    title: string;
    description: string;
    hook: string | null;
    challenge: string | null;
    approach: string | null;
    outcome: string | null;
    githubUrl: string | null;
    websiteUrl: string | null;
    isPrivate: boolean;
    skills: {
      title: string;
      image: string;
    }[];
  };
}

export default async function ProjectCaseStudyView({
  project,
}: ProjectCaseStudyViewProps) {
  const t = await getTranslations("main.portfolio");

  const sections = [
    { key: "challenge", value: project.challenge },
    { key: "approach", value: project.approach },
    { key: "outcome", value: project.outcome },
  ] as const;

  const heroImageUrl = buildCloudinaryUrl(project.image, 896);

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 lg:px-0">
      <Link
        href={{
          pathname: "/",
          hash: "#portfolio",
        }}
        className="text-primary hover:text-primary/80 mb-8 inline-flex text-sm font-medium"
      >
        ← {t("caseStudy.backToPortfolio")}
      </Link>

      <div className="relative mb-8 aspect-video overflow-hidden rounded-2xl">
        <Image
          src={heroImageUrl}
          alt={project.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 896px"
          priority
        />
      </div>

      <header className="space-y-3">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          {project.title}
        </h1>
        <p className="text-muted-foreground text-lg">
          {project.hook ?? project.description}
        </p>
      </header>

      {project.skills.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-2">
          {project.skills.map((skill) => (
            <li
              key={skill.title}
              className="bg-muted border-border inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
            >
              <Image
                src={resolveSkillImageUrl(skill.image)}
                alt=""
                width={16}
                height={16}
              />
              {skill.title}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-10 space-y-8">
        {sections.map((section) =>
          section.value ? (
            <section key={section.key}>
              <h2 className="text-foreground mb-3 text-xl font-semibold">
                {t(`caseStudy.${section.key}`)}
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {section.value}
              </p>
            </section>
          ) : null,
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        {project.websiteUrl ? (
          <a
            href={project.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
          >
            {t("actions.view")}
          </a>
        ) : null}
        {!project.isPrivate && project.githubUrl ? (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="border-border text-foreground hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium"
          >
            {t("actions.source")}
          </a>
        ) : null}
      </div>
    </article>
  );
}
