import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { MdOpenInNew } from "react-icons/md";

import { resolveSkillImageUrl } from "@/utils/tools/image";
import CertificateItem from "@/components/certification/certification-item";
import PortfolioItem from "@/features/home/components/portfolio/project-item";
import { SkillExperienceList } from "@/features/home/components/skills/skill-experience-list";
import { Link } from "@/i18n/routing";
import type { SkillDetailType } from "@/utils/interfaces/types";

interface SkillDetailPageViewProps {
  detail: SkillDetailType;
}

function formatStackType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export async function SkillDetailPageView({
  detail,
}: SkillDetailPageViewProps) {
  const t = await getTranslations("main.skills");
  const skillName = detail.title;

  const hasCertificates = detail.certificates.length > 0;
  const hasExperiences = detail.experiences.length > 0;
  const hasProjects = detail.projects.length > 0;
  const hasRelated = hasCertificates || hasExperiences || hasProjects;

  return (
    <main className="relative mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:pt-4 lg:py-0">
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="text-primaryText-700 flex items-center gap-1.5 overflow-hidden text-sm">
          <li className="flex min-w-0 shrink-0 items-center gap-1.5">
            <Link
              href="/"
              className="hover:text-primaryText-500 whitespace-nowrap transition-colors"
            >
              {t("page.breadcrumbSkills")}
            </Link>
          </li>
          <li className="flex min-w-0 items-center gap-1.5 last:min-w-0 last:shrink">
            <span className="text-primaryText-800/50" aria-hidden>
              /
            </span>
            <span className="text-primaryText-500 truncate font-medium">
              {detail.title}
            </span>
          </li>
        </ol>
      </nav>

      <header className="border-background-100 mb-14 border-b pb-10 md:mb-16 md:pb-12">
        <div className="mb-5 flex flex-col items-center gap-4 md:flex-row md:items-start">
          <div className="bg-background-100 relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-md">
            <Image
              alt=""
              width={40}
              height={40}
              src={resolveSkillImageUrl(detail.image)}
              unoptimized
              className="h-10 w-10 object-contain"
              priority
            />
          </div>
          <div className="min-w-0 flex-1 text-center md:text-left">
            <p className="text-primary-600 text-xs font-bold tracking-widest uppercase">
              {formatStackType(detail.type)}
            </p>
            <div className="mt-1 flex flex-col items-center gap-2 md:flex-row md:items-baseline md:justify-between md:gap-6">
              <h1 className="text-primaryText-500 scroll-m-20 text-3xl font-bold tracking-tight md:text-4xl">
                {detail.title}
              </h1>
              {detail.urlWiki ? (
                <a
                  href={detail.urlWiki}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 hover:text-primary-700 inline-flex shrink-0 items-center gap-1.5 text-sm font-medium transition"
                >
                  {t("modal.readMore")}
                  <MdOpenInNew className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {detail.description ? (
          <p className="text-primaryText-700 max-w-none text-center text-base leading-relaxed text-pretty md:text-left md:text-lg">
            {detail.description}
          </p>
        ) : null}
      </header>

      {!hasRelated ? (
        <p className="text-primaryText-700 py-12 text-center text-sm">
          {t("modal.noRelatedContent")}
        </p>
      ) : (
        <div className="space-y-16 pb-16 md:space-y-20 md:pb-20">
          {hasExperiences ? (
            <section
              className="[contain-intrinsic-size:auto_none_auto_16rem] [content-visibility:auto]"
              aria-labelledby="skill-experience-heading"
            >
              <div className="mb-8 max-w-3xl">
                <h2
                  id="skill-experience-heading"
                  className="text-primaryText-500 text-xl font-semibold tracking-tight sm:text-2xl"
                >
                  {t("page.experiencesTitle", { skill: skillName })}
                </h2>
                <p className="text-primaryText-700 mt-2 text-sm leading-relaxed md:text-base">
                  {t("page.experiencesDescription", { skill: skillName })}
                </p>
              </div>
              <SkillExperienceList experiences={detail.experiences} />
            </section>
          ) : null}

          {hasCertificates ? (
            <section
              className="[contain-intrinsic-size:auto_none_auto_28rem] [content-visibility:auto]"
              aria-labelledby="skill-certificates-heading"
            >
              <div className="mb-8 max-w-3xl">
                <h2
                  id="skill-certificates-heading"
                  className="text-primaryText-500 text-xl font-semibold tracking-tight sm:text-2xl"
                >
                  {t("page.certificatesTitle", { skill: skillName })}
                </h2>
                <p className="text-primaryText-700 mt-2 text-sm leading-relaxed md:text-base">
                  {t("page.certificatesDescription", { skill: skillName })}
                </p>
              </div>
              <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
                {detail.certificates.map((certificate) => (
                  <li key={certificate.id} className="flex">
                    <CertificateItem {...certificate} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {hasProjects ? (
            <section
              className="[contain-intrinsic-size:auto_none_auto_28rem] [content-visibility:auto]"
              aria-labelledby="skill-projects-heading"
            >
              <div className="mb-8 max-w-3xl">
                <h2
                  id="skill-projects-heading"
                  className="text-primaryText-500 text-xl font-semibold tracking-tight sm:text-2xl"
                >
                  {t("page.projectsTitle", { skill: skillName })}
                </h2>
                <p className="text-primaryText-700 mt-2 text-sm leading-relaxed md:text-base">
                  {t("page.projectsDescription", { skill: skillName })}
                </p>
              </div>
              <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
                {detail.projects.map((project) => (
                  <li key={project.id} className="flex justify-center">
                    <PortfolioItem
                      {...project}
                      urlName={t("page.viewProject")}
                      sourceName={t("page.viewSource")}
                      privateName={t("page.privateLabel")}
                      privateDescription={t("page.privateDescription")}
                      canSeeDemo={t("page.canSeeDemo")}
                      caseStudyLabel=""
                      kindLabels={{
                        PROFESSIONAL: "",
                        PERSONAL: "",
                        LEARNING: "",
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}
