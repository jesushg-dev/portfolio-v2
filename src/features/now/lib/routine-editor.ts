import type { StatusSlotInput } from "./status-schedule";

type RoutineRange = Pick<
  StatusSlotInput,
  "startMinute" | "endMinute" | "weekdays"
>;
export type RoutineDayPreset = "daily" | "weekdays" | "weekends" | "custom";
export const ROUTINE_DAY_GROUPS = {
  daily: [1, 2, 3, 4, 5, 6, 0],
  weekdays: [1, 2, 3, 4, 5],
  weekends: [6, 0],
} satisfies Record<Exclude<RoutineDayPreset, "custom">, number[]>;

export function routineDayPreset(days: number[]): RoutineDayPreset {
  for (const preset of ["daily", "weekdays", "weekends"] as const) {
    const expected = ROUTINE_DAY_GROUPS[preset];
    if (
      days.length === expected.length &&
      expected.every((day) => days.includes(day))
    )
      return preset;
  }
  return "custom";
}
function weeklySpans(slot: RoutineRange) {
  return slot.weekdays.flatMap((day) => {
    const start = day * 1440 + slot.startMinute;
    const end =
      day * 1440 +
      slot.endMinute +
      (slot.endMinute <= slot.startMinute ? 1440 : 0);
    return end > 10080
      ? [
          { start, end: 10080 },
          { start: 0, end: end - 10080 },
        ]
      : [{ start, end }];
  });
}
export function findRoutineConflict(
  candidate: RoutineRange,
  others: StatusSlotInput[],
): StatusSlotInput | undefined {
  const candidateSpans = weeklySpans(candidate);
  return others.find((slot) =>
    weeklySpans(slot).some((span) =>
      candidateSpans.some(
        (other) => span.start < other.end && other.start < span.end,
      ),
    ),
  );
}
export function newRoutineSlot(
  languages: { id: string }[],
  slots: StatusSlotInput[],
): StatusSlotInput {
  const value: StatusSlotInput = {
    startMinute: 540,
    endMinute: 600,
    weekdays: [...ROUTINE_DAY_GROUPS.weekdays],
    emoji: "📌",
    translations: Object.fromEntries(
      languages.map((language) => [language.id, { body: "" }]),
    ),
  };
  for (let minute = 420; minute <= 1260; minute += 30) {
    const candidate = { ...value, startMinute: minute, endMinute: minute + 60 };
    if (!findRoutineConflict(candidate, slots)) return candidate;
  }
  return value;
}
export function routineTime(value: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, 0, value)));
}
