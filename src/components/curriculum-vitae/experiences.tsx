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
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-[0.12em] text-[#0a3d7a] uppercase before:h-4 before:w-1 before:rounded-full before:bg-[#0a3d7a] before:content-['']">
        {t("header.experience")}
      </h2>

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
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white text-sm font-bold text-[#0a3d7a]">
      {logoUrl && !hasError ? (
        <MediaImage
          src={logoUrl}
          alt=""
          width={36}
          height={36}
          className="size-full object-contain"
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
    <article className="mb-6 last:mb-0">
      <div className="flex items-start gap-3">
        <CompanyLogo name={company} logoUrl={logoUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <h3 className="text-[1.0625rem] leading-tight font-bold text-slate-900">
              {company}
            </h3>
            {overallDates ? (
              <p className="text-sm text-slate-600 tabular-nums">
                {overallDates}
              </p>
            ) : null}
          </div>
          {blurb ? (
            <p className="mt-0.5 text-sm text-slate-600 italic">{blurb}</p>
          ) : null}
        </div>
      </div>

      {roles.map((role) => (
        <RoleBlock
          key={role.id}
          experience={role}
          locale={locale}
          isMultiRole={isMultiRole}
        />
      ))}
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
      className={`${isMultiRole ? "border-l-2 border-[#0a3d7a]/20 pl-4" : ""} mt-3`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h4 className="text-[0.9375rem] font-bold text-slate-900">
          {experience.role}
        </h4>
        <p className="text-sm text-slate-600 tabular-nums">{dates}</p>
      </div>

      {meta ? <p className="text-sm text-slate-600">{meta}</p> : null}

      {experience.responsibilities.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
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
    <li className="relative pl-4 text-sm leading-[1.45] text-slate-800 before:absolute before:top-[0.6em] before:left-0 before:size-1.5 before:rounded-full before:bg-[#0a3d7a] before:content-['']">
      <HighlightMetrics text={responsibility.text} />
    </li>
  );
}
