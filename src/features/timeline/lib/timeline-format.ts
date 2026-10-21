/**
 * Date and text formatting utilities for the public timeline.
 */

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function getOrganizationInitials(name: string): string {
  if (!name) return "";
  const cleaned = name.replace(/&.*$/, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) {
    return (words[0]?.slice(0, 2) ?? "").toUpperCase();
  }
  return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
}

/**
 * Format a partial date string like "2024-11", "2022", or full ISO string.
 */
export function formatTimelineMonthYear(
  raw: string | Date | null | undefined,
): string {
  if (!raw) return "";

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    // Case 1: Simple year only ("2022")
    if (/^\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    // Case 2: Year-Month ("2024-11")
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
      const [yearStr, monthStr] = trimmed.split("-");
      const monthIdx = Number(monthStr) - 1;
      const monthName = MONTH_NAMES_SHORT[monthIdx] ?? monthStr;
      return `${monthName} ${yearStr}`;
    }
  }

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";

  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();

  // If set to Jan 1st at 00:00:00, check whether it was intended as a whole year
  // (e.g. 2017, 2020, 2022 in legacy seeds)
  if (month === 0 && day === 1 && d.toISOString().endsWith("T00:00:00.000Z")) {
    return `${year}`;
  }

  const monthName = MONTH_NAMES_SHORT[month] ?? "";
  return `${monthName} ${year}`;
}

export function formatTimelineRange({
  startDate,
  endDate,
  current,
  presentLabel = "Present",
}: {
  startDate: string | Date;
  endDate?: string | Date | null;
  current?: boolean;
  presentLabel?: string;
}): string {
  const startStr = formatTimelineMonthYear(startDate);
  if (!startStr) return "";

  if (current) {
    return `${startStr} – ${presentLabel}`;
  }

  if (!endDate) {
    return startStr;
  }

  const endStr = formatTimelineMonthYear(endDate);
  if (!endStr || endStr === startStr) {
    return startStr;
  }

  return `${startStr} – ${endStr}`;
}

export function calculateTimelineDuration(
  startDate: string | Date,
  endDate?: string | Date | null,
  current?: boolean,
): string {
  const start = new Date(startDate);
  const end = current || !endDate ? new Date() : new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }

  const startTotalMonths = start.getUTCFullYear() * 12 + start.getUTCMonth();
  const endTotalMonths = end.getUTCFullYear() * 12 + end.getUTCMonth();
  const diffMonths = Math.max(1, endTotalMonths - startTotalMonths);

  const years = Math.floor(diffMonths / 12);
  const remainingMonths = diffMonths % 12;

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? "yr" : "yrs"}`);
  }
  if (remainingMonths > 0) {
    parts.push(`${remainingMonths} ${remainingMonths === 1 ? "mo" : "mos"}`);
  }

  return parts.join(" ");
}
