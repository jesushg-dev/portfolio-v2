/**
 * Groups consecutive experiences that share the same company name.
 * Non-adjacent stints at the same company (A → B → A) stay separate groups.
 */

export interface ExperienceCompanyFields {
  company: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  current?: boolean | null;
}

export interface ExperienceCompanyGroup<T extends ExperienceCompanyFields> {
  /** Display company from the first role in the run. */
  company: string;
  overallStart: Date | null;
  overallEnd: Date | null;
  overallCurrent: boolean;
  roles: T[];
}

export function normalizeCompanyKey(company: string): string {
  return company.trim().toLowerCase();
}

export function areSameCompany(a: string, b: string): boolean {
  const left = normalizeCompanyKey(a);
  const right = normalizeCompanyKey(b);
  return left.length > 0 && left === right;
}

export function parseExperienceDate(
  value: Date | string | null | undefined,
): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const yearMonth = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(trimmed);
  if (yearMonth) {
    return new Date(
      Date.UTC(Number(yearMonth[1]), Number(yearMonth[2]) - 1, 1),
    );
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function computeOverallDates<T extends ExperienceCompanyFields>(
  roles: T[],
): Pick<
  ExperienceCompanyGroup<T>,
  "overallStart" | "overallEnd" | "overallCurrent"
> {
  let overallStart: Date | null = null;
  let overallEnd: Date | null = null;
  let overallCurrent = false;

  for (const role of roles) {
    if (role.current) overallCurrent = true;

    const start = parseExperienceDate(role.startDate);
    if (start && (!overallStart || start.getTime() < overallStart.getTime())) {
      overallStart = start;
    }

    const end = parseExperienceDate(role.endDate);
    if (end && (!overallEnd || end.getTime() > overallEnd.getTime())) {
      overallEnd = end;
    }
  }

  if (overallCurrent) {
    overallEnd = null;
  }

  return { overallStart, overallEnd, overallCurrent };
}

export function groupConsecutiveExperiencesByCompany<
  T extends ExperienceCompanyFields,
>(experiences: T[]): ExperienceCompanyGroup<T>[] {
  const groups: ExperienceCompanyGroup<T>[] = [];

  for (const experience of experiences) {
    const previous = groups[groups.length - 1];
    if (previous && areSameCompany(previous.company, experience.company)) {
      previous.roles.push(experience);
      const overall = computeOverallDates(previous.roles);
      previous.overallStart = overall.overallStart;
      previous.overallEnd = overall.overallEnd;
      previous.overallCurrent = overall.overallCurrent;
      continue;
    }

    const overall = computeOverallDates([experience]);
    groups.push({
      company: experience.company.trim() || experience.company,
      overallStart: overall.overallStart,
      overallEnd: overall.overallEnd,
      overallCurrent: overall.overallCurrent,
      roles: [experience],
    });
  }

  return groups;
}

function toYearMonth(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  return date.toISOString().slice(0, 7);
}

export function unifyConsecutiveExperiencesByCompany<
  T extends ExperienceCompanyFields & {
    id: string;
    role: string;
    location?: string | null;
    companyBlurb?: string | null;
    responsibilities: string[];
    atsResponsibilities?: string[];
  },
>(experiences: T[]): T[] {
  const unified: T[] = [];

  for (const experience of experiences) {
    const previous = unified[unified.length - 1];
    if (previous && areSameCompany(previous.company, experience.company)) {
      const roles = [previous, experience];
      const overall = computeOverallDates(roles);

      previous.startDate =
        toYearMonth(overall.overallStart) ?? previous.startDate;
      previous.endDate = overall.overallCurrent
        ? undefined
        : (toYearMonth(overall.overallEnd) ?? previous.endDate);
      previous.current = overall.overallCurrent;

      for (const resp of experience.responsibilities) {
        if (!previous.responsibilities.includes(resp)) {
          previous.responsibilities.push(resp);
        }
      }

      if (experience.atsResponsibilities) {
        previous.atsResponsibilities ??= [];
        for (const resp of experience.atsResponsibilities) {
          if (!previous.atsResponsibilities.includes(resp)) {
            previous.atsResponsibilities.push(resp);
          }
        }
      }

      if (!previous.location && experience.location) {
        previous.location = experience.location;
      }
      if (!previous.companyBlurb && experience.companyBlurb) {
        previous.companyBlurb = experience.companyBlurb;
      }

      continue;
    }

    unified.push({
      ...experience,
      responsibilities: [...experience.responsibilities],
      atsResponsibilities: experience.atsResponsibilities
        ? [...experience.atsResponsibilities]
        : [],
    });
  }

  return unified;
}
