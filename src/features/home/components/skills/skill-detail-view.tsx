"use client";

import { useMemo, type FC } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Award, Briefcase, Code, ExternalLink, Sparkles } from "lucide-react";

import { getPathname, Link } from "@/i18n/routing";
import { api } from "@/trpc/react";
import { buttonVariants } from "@/components/ui/button";
import { formatIssuedDate } from "@/components/certification/format-issued-date";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectThumbnail } from "@/features/home/components/portfolio/project-thumbnail";
import type { SkillDetailType } from "@/utils/interfaces/types";
import SkillIcon from "./skill-icon";
import { SkillExperienceList } from "./skill-experience-list";
import { SkillModalTabs, type SkillModalTab } from "./skill-modal-tabs";

interface SkillDetailViewProps {
  skillSlug: string;
  compact?: boolean;
}

export const SkillDetailView: FC<SkillDetailViewProps> = ({
  skillSlug,
  compact = false,
}) => {
  const locale = useLocale();
  const t = useTranslations("main.skills");

  const {
    data: detail,
    isLoading,
    isError,
  } = api.portfolio.getSkillBySlug.useQuery(
    { slug: skillSlug, locale },
    { enabled: Boolean(skillSlug) },
  );

  const { certificates, experiences, projects } = useMemo(
    (): {
      certificates: SkillDetailType["certificates"];
      experiences: SkillDetailType["experiences"];
      projects: SkillDetailType["projects"];
    } => ({
      certificates: detail?.certificates ?? [],
      experiences: detail?.experiences ?? [],
      projects: detail?.projects ?? [],
    }),
    [detail],
  );

  const tabs = useMemo((): SkillModalTab[] => {
    if (!detail) return [];

    const skill = detail.title;

    return [
      {
        id: "certificates",
        label: t("modal.tabCertificates"),
        count: certificates.length,
        hint: t("page.certificatesDescription", { skill }),
        content:
          certificates.length > 0 ? (
            <CertificateList certificates={certificates} />
          ) : (
            <TabEmpty message={t("modal.emptyTab")} />
          ),
      },
      {
        id: "experiences",
        label: t("modal.tabExperiences"),
        count: experiences.length,
        hint: t("page.experiencesDescription", { skill }),
        content:
          experiences.length > 0 ? (
            <ExperienceList experiences={experiences} />
          ) : (
            <TabEmpty message={t("modal.emptyTab")} />
          ),
      },
      {
        id: "projects",
        label: t("modal.tabProjects"),
        count: projects.length,
        hint: t("page.projectsDescription", { skill }),
        content:
          projects.length > 0 ? (
            <ProjectList projects={projects} />
          ) : (
            <TabEmpty message={t("modal.emptyTab")} />
          ),
      },
    ];
  }, [certificates, detail, experiences, projects, t]);

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <div className="shrink-0 space-y-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-9 w-full shrink-0" />
        <Skeleton className="min-h-0 flex-1 rounded-lg" />
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div
        className={
          compact
            ? "text-muted-foreground flex flex-1 items-center justify-center p-6 text-center"
            : "text-muted-foreground flex flex-col items-center justify-center p-8 text-center"
        }
      >
        <p>{t("modal.loadError")}</p>
      </div>
    );
  }

  const header = (
    <>
      <div className="flex items-center gap-3">
        <SkillIcon
          image={detail.image}
          title={detail.title}
          className="text-primary size-8"
        />
        <div className="min-w-0">
          <h2 className="text-foreground text-xl font-bold">{detail.title}</h2>
          <p className="text-muted-foreground text-xs uppercase">
            {detail.type}
          </p>
        </div>
      </div>

      {detail.description ? (
        <p
          className={
            compact
              ? "text-muted-foreground line-clamp-2 text-sm leading-snug"
              : "text-muted-foreground text-sm leading-relaxed"
          }
        >
          {detail.description}
        </p>
      ) : null}
    </>
  );

  if (compact) {
    const fullPageHref = getPathname({
      locale,
      href: {
        pathname: "/skills/[slug]",
        params: { slug: skillSlug },
      },
    });

    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mb-4 shrink-0 space-y-3">{header}</div>

        <SkillModalTabs key={skillSlug} tabs={tabs} />

        <div className="border-border mt-4 shrink-0 border-t pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <a
            href={fullPageHref}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "w-full",
            })}
            onClick={(event) => {
              event.preventDefault();
              // Hard navigation bypasses the @modal intercept route (same URL soft-nav is a no-op).
              window.location.assign(fullPageHref);
            }}
          >
            {t("modal.viewFullPage")}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {header}

      {tabs.map((tab) => (
        <section key={tab.id} className="flex flex-col gap-3">
          <SectionHeading id={tab.id} label={tab.label} />
          <p className="text-muted-foreground text-sm">{tab.hint}</p>
          {tab.content}
        </section>
      ))}
    </div>
  );
};

function TabEmpty({ message }: { message: string }) {
  return (
    <p className="text-muted-foreground border-border bg-muted/30 rounded-lg border border-dashed px-4 py-8 text-center text-sm">
      {message}
    </p>
  );
}

function SectionHeading({ id, label }: { id: string; label: string }) {
  const Icon =
    id === "certificates" ? Award : id === "experiences" ? Briefcase : Code;

  return (
    <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
      <Icon className="text-primary size-4" />
      <span>{label}</span>
    </h3>
  );
}

function CertificateList({
  certificates,
}: {
  certificates: SkillDetailType["certificates"];
}) {
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-2">
      {certificates.map((cert) => (
        <div
          key={cert.id}
          className="bg-card border-border flex items-center justify-between rounded-lg border p-3"
        >
          <div className="min-w-0">
            <h4 className="text-foreground text-sm font-medium">
              {cert.title}
            </h4>
            <p className="text-muted-foreground text-xs">{cert.company}</p>
          </div>
          {cert.issuedDate ? (
            <span className="text-muted-foreground shrink-0 text-xs">
              {formatIssuedDate(cert.issuedDate, locale)}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ExperienceList({
  experiences,
}: {
  experiences: SkillDetailType["experiences"];
}) {
  return <SkillExperienceList experiences={experiences} compact />;
}

function ProjectList({ projects }: { projects: SkillDetailType["projects"] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {projects.map((proj) => {
        const itemClassName =
          "bg-card border-border flex items-center gap-3 rounded-lg border p-3 transition-colors " +
          (proj.slug ? "hover:border-primary/40" : "");

        const content = (
          <>
            <ProjectThumbnail
              image={proj.image}
              title={proj.title}
              fallback={<Sparkles className="text-muted-foreground size-5" />}
            />
            <div className="min-w-0">
              <h4 className="text-foreground line-clamp-1 text-sm font-medium">
                {proj.title}
              </h4>
              <p className="text-muted-foreground line-clamp-1 text-xs">
                {proj.description}
              </p>
            </div>
          </>
        );

        if (proj.slug) {
          return (
            <Link
              key={proj.id}
              href={{
                pathname: "/projects/[slug]",
                params: { slug: proj.slug },
              }}
              className={itemClassName}
            >
              {content}
            </Link>
          );
        }

        return (
          <div key={proj.id} className={itemClassName}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
