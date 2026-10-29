import type { ContributionDay } from "./github-contributions";

// SVG viewBox coordinates are drawing units, independent of CSS layout size.
export const blockColors = [
  "var(--muted)",
  "var(--success)",
  "var(--primary)",
  "var(--warning)",
  "var(--destructive)",
];
export const languageColors = [
  "var(--primary)",
  "var(--success)",
  "var(--warning)",
  "var(--destructive)",
  "var(--muted-foreground)",
  "var(--border)",
];
export interface ContributionCell extends ContributionDay {
  week: number;
}
export function contributionCells(
  weeks: ContributionDay[][],
): ContributionCell[] {
  return weeks.flatMap((week, index) =>
    week.map((day) => ({ ...day, week: index })),
  );
}
export function contributionLabel(
  day: ContributionDay,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(day.date + "T12:00:00Z"));
}
