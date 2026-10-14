import { useTranslations, useLocale } from "next-intl";

import { formatExperienceDates } from "@/utils/tools/date";
import type { Locale } from "@/i18n/config";
import { groupConsecutiveExperiencesByCompany } from "@/lib/cv/group-consecutive-experiences-by-company";
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
    <>
      <h5 className="text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.experience")}
      </h5>

      {groups.map((group) => (
        <ExperienceCompanyGroup
          key={`${group.company}-${group.roles[0]?.id ?? "group"}`}
          company={group.company}
          overallStart={group.overallStart}
          overallEnd={group.overallEnd}
          overallCurrent={group.overallCurrent}
          roles={group.roles}
          locale={dateLocale}
          t={t}
        />
      ))}
    </>
  );
}

function ExperienceCompanyGroup({
  company,
  overallStart,
  overallEnd,
  overallCurrent,
  roles,
  locale,
  t,
}: {
  company: string;
  overallStart: Date | null;
  overallEnd: Date | null;
  overallCurrent: boolean;
  roles: CvExperience[];
  locale: Locale;
  t: ReturnType<typeof useTranslations<"curriculum">>;
}) {
  if (roles.length === 1 && roles[0]) {
    return (
      <RoleBlock
        experience={roles[0]}
        locale={locale}
        showCompanyInline
        t={t}
      />
    );
  }

  const overallDates = formatExperienceDates(
    overallStart,
    overallEnd,
    overallCurrent,
    locale,
  );

  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold text-[#333333]">
        {company}
        {overallDates ? ` · ${overallDates}` : ""}
      </h3>
      <div className="mt-2 space-y-2">
        {roles.map((role) => (
          <RoleBlock
            key={role.id}
            experience={role}
            locale={locale}
            showCompanyInline={false}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

function RoleBlock({
  experience,
  locale,
  showCompanyInline,
  t,
}: {
  experience: CvExperience;
  locale: Locale;
  /** When true, this is a single-role group — keep legacy company · dates line. */
  showCompanyInline: boolean;
  t: ReturnType<typeof useTranslations<"curriculum">>;
}) {
  const dates = formatExperienceDates(
    experience.startDate,
    experience.endDate,
    experience.current,
    locale,
  );
  const typeLabel = experience.employmentType
    ? t(`employmentTypes.${experience.employmentType}`)
    : null;

  if (showCompanyInline) {
    return (
      <div className="mb-4">
        <h3 className="text-sm font-bold">{experience.role}</h3>
        <h4 className="my-1 text-sm text-[#333333]">
          {experience.company}
          {typeLabel ? ` · ${typeLabel}` : ""}
          {dates ? ` · ${dates}` : ""}
        </h4>
        {experience.responsibilities.length > 0 ? (
          <ul className="list-disc pl-8 text-sm text-[#1a1a1a]">
            {experience.responsibilities.map((responsibility) => (
              <ResponsibilityItem
                key={responsibility.id}
                responsibility={responsibility}
              />
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mb-3">
      <h3 className="text-sm font-bold">
        {experience.role}
        {typeLabel ? (
          <span className="font-normal text-[#333333]"> · {typeLabel}</span>
        ) : null}
        {dates ? (
          <span className="font-normal text-[#333333]"> · {dates}</span>
        ) : null}
      </h3>
      {experience.responsibilities.length > 0 ? (
        <ul className="mt-1 list-disc pl-8 text-sm text-[#1a1a1a]">
          {experience.responsibilities.map((responsibility) => (
            <ResponsibilityItem
              key={responsibility.id}
              responsibility={responsibility}
            />
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
  return <li>{responsibility.text}</li>;
}
