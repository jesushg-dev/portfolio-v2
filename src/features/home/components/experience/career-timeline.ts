export interface CareerExperience {
  id: string;
  company: string;
  role: string;
  dates: string;
  startDate: Date | null;
  endDate?: Date | null;
  current: boolean;
  responsibilities: string[];
  skills?: string[];
}

/** Compare complete calendar months in UTC so server/client timezones agree. */
function completeUtcMonths(startTimestamp: number, endTimestamp: number) {
  const start = new Date(startTimestamp);
  const end = new Date(endTimestamp);
  const months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    end.getUTCMonth() -
    start.getUTCMonth();
  const anniversary = new Date(startTimestamp);
  const lastDay = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0),
  ).getUTCDate();
  anniversary.setUTCFullYear(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    Math.min(start.getUTCDate(), lastDay),
  );
  return Math.max(0, months - (endTimestamp < anniversary.getTime() ? 1 : 0));
}

/** Merge overlapping jobs so concurrent roles never inflate the duration. */
export function getCareerMonths(
  experiences: CareerExperience[],
  referenceDate: Date,
) {
  const now = referenceDate.getTime();
  const periods = experiences
    .flatMap((experience): [number, number][] => {
      const start = experience.startDate?.getTime();
      const recordedEnd = experience.current
        ? now
        : experience.endDate?.getTime();
      const end =
        recordedEnd === undefined ? undefined : Math.min(recordedEnd, now);
      return start !== undefined &&
        end !== undefined &&
        Number.isFinite(start) &&
        Number.isFinite(end) &&
        end > start
        ? [[start, end]]
        : [];
    })
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [start, end] of periods) {
    const last = merged.at(-1);
    if (!last || start > last[1]) merged.push([start, end]);
    else last[1] = Math.max(last[1], end);
  }
  return Math.max(
    0,
    merged.reduce(
      (sum, [start, end]) => sum + completeUtcMonths(start, end),
      0,
    ),
  );
}

/** Vertical position represents milestone order, not a performance score. */
export function getCareerMilestones(experiences: CareerExperience[]) {
  const dated = experiences
    .filter(
      (experience) =>
        experience.startDate && Number.isFinite(experience.startDate.getTime()),
    )
    .toSorted((a, b) => a.startDate!.getTime() - b.startDate!.getTime());
  const first = dated[0]?.startDate?.getTime() ?? 0;
  const last = dated.at(-1)?.startDate?.getTime() ?? first;

  return dated.map((experience, index) => ({
    experience,
    x:
      last === first
        ? 50
        : 8 + ((experience.startDate!.getTime() - first) / (last - first)) * 84,
    y: dated.length === 1 ? 24 : 38 - (index / (dated.length - 1)) * 28,
  }));
}
