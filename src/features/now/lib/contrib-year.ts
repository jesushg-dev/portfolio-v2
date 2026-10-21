import { cn } from "@/lib/utils";

/** Deterministic 0..1 — avoids Math.random during render. */
function unit(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export interface ContributionDayCell {
  key: string;
  level: 0 | 1 | 2 | 3 | 4;
  title: string;
  week: number;
  monthLabel: string | null;
}

export function buildContributionYear(
  locale = "en",
  days = 371,
): {
  cells: ContributionDayCell[];
  total: number;
} {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  start.setDate(start.getDate() - start.getDay());

  const cells: ContributionDayCell[] = [];
  let total = 0;
  let lastMonth = -1;
  let week = 0;

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    if (i > 0 && dow === 0) week++;

    let monthLabel: string | null = null;
    if (dow === 0 && d.getMonth() !== lastMonth) {
      lastMonth = d.getMonth();
      monthLabel = d.toLocaleString(locale, { month: "short" });
    }

    const r = unit(i + 1);
    const count = r < 0.28 ? 0 : Math.floor(unit(i + 2) * unit(i + 3) * 10);
    total += count;
    const level =
      count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 9 ? 3 : 4;

    cells.push({
      key: d.toISOString().slice(0, 10),
      level,
      week,
      monthLabel,
      title: `${count} contributions on ${d.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`,
    });
  }

  return { cells, total };
}

export const CONTRIB_LEVEL_CLASS: Record<ContributionDayCell["level"], string> =
  {
    0: "bg-border",
    1: "bg-primary/20",
    2: "bg-primary/45",
    3: "bg-primary/70",
    4: "bg-primary",
  };

export function contribCellClass(level: ContributionDayCell["level"]) {
  return cn("size-2.5 rounded-[2px]", CONTRIB_LEVEL_CLASS[level]);
}
