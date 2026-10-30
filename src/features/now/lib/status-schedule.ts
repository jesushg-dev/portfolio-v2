import { z } from "zod";

export const statusSlotSchema = z.object({
  id: z
    .string()
    .regex(/^[a-f0-9]{24}$/i)
    .optional(),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(0).max(1439),
  weekdays: z
    .array(z.number().int().min(0).max(6))
    .min(1)
    .max(7)
    .refine((days) => new Set(days).size === days.length),
  emoji: z.string().trim().min(1).max(16),
  translations: z
    .record(z.string(), z.object({ body: z.string() }))
    .refine(
      (rows) => Object.values(rows).some((row) => row.body.trim()),
      "Add a status description in at least one language",
    ),
});
export const statusScheduleSchema = z
  .array(statusSlotSchema)
  .max(32)
  .superRefine((slots, ctx) => {
    const ids = slots.flatMap((slot) => (slot.id ? [slot.id] : []));
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: "custom", message: "Duplicate status ID" });
    const spans: { start: number; end: number; index: number }[] = [];
    slots.forEach((slot, index) => {
      for (const day of slot.weekdays) {
        const start = day * 1440 + slot.startMinute;
        const end =
          day * 1440 +
          slot.endMinute +
          (slot.endMinute <= slot.startMinute ? 1440 : 0);
        spans.push({ start, end: Math.min(end, 10080), index });
        if (end > 10080) spans.push({ start: 0, end: end - 10080, index });
      }
    });
    for (let i = 0; i < spans.length; i++)
      for (let j = i + 1; j < spans.length; j++) {
        if (spans[i].start < spans[j].end && spans[j].start < spans[i].end) {
          ctx.addIssue({
            code: "custom",
            path: [spans[j].index, "startMinute"],
            message: "This time range overlaps another status",
          });
          return;
        }
      }
  });
export type StatusSlotInput = z.infer<typeof statusSlotSchema>;
export interface PublicStatusSlot {
  id: string;
  startMinute: number;
  endMinute: number;
  weekdays: number[];
  emoji: string;
  body: string;
}
export function minuteLabel(value: number): string {
  return (
    String(Math.floor(value / 60)).padStart(2, "0") +
    ":" +
    String(value % 60).padStart(2, "0")
  );
}
export function parseMinute(value: string): number {
  if (!/^\d{2}:\d{2}$/.test(value)) return Number.NaN;
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}
export function resolveStatusSlot<
  T extends Pick<PublicStatusSlot, "startMinute" | "endMinute" | "weekdays">,
>(slots: T[], timezone: string, now: Date): T | undefined {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
  } catch {
    return undefined;
  }
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    parts.find((part) => part.type === "weekday")?.value ?? "",
  );
  const minute =
    Number(parts.find((part) => part.type === "hour")?.value) * 60 +
    Number(parts.find((part) => part.type === "minute")?.value);
  return slots.find((slot) =>
    slot.endMinute > slot.startMinute
      ? slot.weekdays.includes(day) &&
        minute >= slot.startMinute &&
        minute < slot.endMinute
      : (slot.weekdays.includes(day) && minute >= slot.startMinute) ||
        (slot.weekdays.includes((day + 6) % 7) && minute < slot.endMinute),
  );
}
