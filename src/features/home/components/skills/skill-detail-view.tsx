"use client";

import { useMemo, type FC } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Award, Briefcase, Code, Sparkles } from "lucide-react";

import { Link } from "@/i18n/routing";
import { api } from "@/trpc/react";
import { formatIssuedDate } from "@/components/certification/format-issued-date";
import { Skeleton } from "@/components/ui/skeleton";
import type { SkillDetailType } from "@/utils/interfaces/types";
import SkillIcon from "./skill-icon";

interface SkillDetailViewProps {
  skillSlug: string;
  compact?: boolean;
}

export const SkillDetailView: FC<SkillDetailViewProps> = ({ skillSlug }) => {
  const locale = useLocale();

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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center p-8 text-center">
        <p>Skill not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <SkillIcon
          image={detail.image}
          title={detail.title}
          className="text-primary size-8"
        />
        <div>
          <h2 className="text-foreground text-xl font-bold">{detail.title}</h2>
          <p className="text-muted-foreground text-xs">{detail.type}</p>
        </div>
      </div>

      {detail.description && (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {detail.description}
        </p>
      )}

      {certificates.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
            <Award className="text-primary size-4" />
            <span>Certifications</span>
          </h3>
          <div className="flex flex-col gap-2">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-card border-border flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <h4 className="text-foreground text-sm font-medium">
                    {cert.title}
                  </h4>
                  <p className="text-muted-foreground text-xs">
                    {cert.company}
                  </p>
                </div>
                {cert.issuedDate && (
                  <span className="text-muted-foreground text-xs">
                    {formatIssuedDate(cert.issuedDate)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {experiences.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
            <Briefcase className="text-primary size-4" />
            <span>Experience</span>
          </h3>
          <div className="flex flex-col gap-2">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                className="bg-card border-border flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <h4 className="text-foreground text-sm font-medium">
                    {exp.role}
                  </h4>
                  <p className="text-muted-foreground text-xs">{exp.company}</p>
                </div>
                <span className="text-muted-foreground text-xs font-medium">
                  {exp.dates}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
            <Code className="text-primary size-4" />
            <span>Projects</span>
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {projects.map((proj) => {
              const itemClassName =
                "bg-card border-border flex items-center gap-3 rounded-lg border p-3 transition-colors " +
                (proj.slug ? "hover:border-primary/40" : "");

              const content = (
                <>
                  {proj.image ? (
                    <Image
                      src={proj.image}
                      alt={proj.title}
                      width={40}
                      height={40}
                      className="size-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex size-10 items-center justify-center rounded-md">
                      <Sparkles className="text-muted-foreground size-5" />
                    </div>
                  )}
                  <div>
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
        </div>
      )}
    </div>
  );
};
