"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

import { formatExperienceDates } from "@/utils/tools/date";
import type { Locale } from "@/i18n/config";
import { groupConsecutiveExperiencesByCompany } from "@/lib/cv/group-consecutive-experiences-by-company";
import { getEmploymentTypeLabel } from "@/lib/cv/employment-type";
import { getCompanyInitials } from "@/lib/cv/cv-initials";
import { HighlightMetrics } from "@/lib/cv/highlight-metrics";
import { MediaImage } from "@/components/shared/media-image";
import type { LocalizedCvData } from "./types";

interface IExperiencesProps {
  experiences: LocalizedCvData["experiences"];
  /** Preview language; defaults to the route locale. */
  locale?: Locale;
}

type CvExperience = LocalizedCvData["experiences"][number];

export default function Experiences({
  experiences,
  locale,
}: IExperiencesProps) {
  const t = useTranslations("curriculum");
  const routeLocale = useLocale();
  const dateLocale = locale ?? routeLocale;

  if (!experiences.length) return null;

  const groups = groupConsecutiveExperiencesByCompany(experiences);

  return (
    <section>
      <h2 className="text-primary before:bg-primary mb-4 flex items-center gap-2 font-mono text-xs font-bold tracking-[0.18em] uppercase before:h-3.5 before:w-1 before:rounded-xs before:content-['']">
        {t("header.experience")}
      </h2>

      <div className="divide-border divide-y">
        {groups.map((group) => (
          <ExperienceCompanyGroup
            key={`${group.company}-${group.roles[0]?.id ?? "group"}`}
            company={group.company}
            overallStart={group.overallStart}
            overallEnd={group.overallEnd}
            overallCurrent={group.overallCurrent}
            roles={group.roles}
            locale={dateLocale}
          />
        ))}
      </div>
    </section>
  );
}

function CompanyLogo({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string | null;
}) {
  const [hasError, setHasError] = useState(false);
  const initials = getCompanyInitials(name);

  return (
    <span className="border-border from-primary to-primary/80 text-primary-foreground flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-gradient-to-br text-xs font-bold shadow-2xs">
      {logoUrl && !hasError ? (
        <MediaImage
          src={logoUrl}
          alt=""
          width={40}
          height={40}
          className="bg-card size-full object-contain p-1"
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}

function ExperienceCompanyGroup({
  company,
  overallStart,
  overallEnd,
  overallCurrent,
  roles,
  locale,
}: {
  company: string;
  overallStart: Date | null;
  overallEnd: Date | null;
  overallCurrent: boolean;
  roles: CvExperience[];
  locale: Locale;
}) {
  const isMultiRole = roles.length > 1;
  const overallDates = isMultiRole
    ? formatExperienceDates(overallStart, overallEnd, overallCurrent, locale)
    : "";
  const logoUrl = roles[0]?.companyLogoUrl;
  const blurb = roles[0]?.companyBlurb;

  return (
    <article className="py-6 first:pt-1 last:pb-0">
      <div className="flex items-start gap-3.5">
        <CompanyLogo name={company} logoUrl={logoUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <h3 className="text-foreground text-base font-bold tracking-tight">
              {company}
            </h3>
            {overallDates ? (
              <p className="text-muted-foreground font-mono text-xs tabular-nums">
                {overallDates}
              </p>
            ) : null}
          </div>
          {blurb ? (
            <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed italic">
              {blurb}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        {roles.map((role) => (
          <RoleBlock
            key={role.id}
            experience={role}
            locale={locale}
            isMultiRole={isMultiRole}
          />
        ))}
      </div>
    </article>
  );
}

function RoleBlock({
  experience,
  locale,
  isMultiRole,
}: {
  experience: CvExperience;
  locale: Locale;
  isMultiRole: boolean;
}) {
  const dates = formatExperienceDates(
    experience.startDate,
    experience.endDate,
    experience.current,
    locale,
  );
  const typeLabel = experience.employmentType
    ? getEmploymentTypeLabel(experience.employmentType, locale)
    : "";
  const meta = [typeLabel, experience.location].filter(Boolean).join(" · ");

  return (
    <div
      className={`${isMultiRole ? "border-primary/20 ml-4 border-l-2 pl-4" : "ml-13.5"} mt-3`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h4 className="text-foreground text-sm font-semibold">
          {experience.role}
        </h4>
        <p className="text-muted-foreground font-mono text-xs tabular-nums">
          {dates}
        </p>
      </div>

      {meta ? (
        <p className="text-muted-foreground mt-0.5 text-xs">{meta}</p>
      ) : null}

      {experience.responsibilities.length > 0 ? (
        <ul className="mt-2.5 space-y-1.5">
          {experience.responsibilities.map((resp) => (
            <ResponsibilityItem key={resp.id} responsibility={resp} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ResponsibilityItem({
  responsibility,
}: {
  responsibility: CvExperience["responsibilities"][number];
}) {
  return (
    <li className="text-foreground/90 before:bg-primary relative pl-4 text-xs leading-[1.55] before:absolute before:top-[0.55em] before:left-0 before:size-1.5 before:rounded-full before:content-['']">
      <HighlightMetrics text={responsibility.text} />
    </li>
  );
}
