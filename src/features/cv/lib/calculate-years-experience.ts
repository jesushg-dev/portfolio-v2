export interface ExperienceInterval {
  startDate: Date | null;
  endDate?: Date | null;
  current?: boolean | null;
}

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

/**
 * Calculates cumulative years of professional experience by merging overlapping
 * date intervals, discounting gaps between roles, and flooring the total.
 */
export function calculateCumulativeYearsExperience(
  experiences: ExperienceInterval[],
  referenceDate: Date = new Date(),
): number {
  const intervals: [number, number][] = [];
  const now = referenceDate.getTime();

  for (const exp of experiences) {
    if (!exp.startDate) continue;
    const start = exp.startDate.getTime();
    if (Number.isNaN(start)) continue;

    let end: number;
    if (exp.current || !exp.endDate) {
      end = now;
    } else {
      end = exp.endDate.getTime();
      if (Number.isNaN(end)) end = now;
    }

    if (end > start) {
      intervals.push([start, end]);
    }
  }

  if (intervals.length === 0) return 0;

  intervals.sort((a, b) => a[0] - b[0]);

  const merged: [number, number][] = [];
  for (const [start, end] of intervals) {
    const last = merged[merged.length - 1];
    if (!last || start > last[1]) {
      merged.push([start, end]);
    } else if (end > last[1]) {
      last[1] = end;
    }
  }

  const totalMs = merged.reduce((acc, [start, end]) => acc + (end - start), 0);
  return Math.floor(totalMs / MS_PER_YEAR);
}

