import {
  EVENT_TYPES,
  TYPE_DEFAULTS,
  eventWhatSchema,
  eventWhenSchema,
  eventWhereSchema,
} from "./event-create-stepper";

describe("event create stepper schemas", () => {
  it("lists every event type with a default duration", () => {
    for (const type of EVENT_TYPES) {
      expect(TYPE_DEFAULTS[type].duration).toBeGreaterThan(0);
    }
  });

  it("accepts a valid what step", () => {
    expect(
      eventWhatSchema.parse({
        applicationId: "app-1",
        type: "INTERVIEW",
        title: "Screening",
      }),
    ).toMatchObject({ title: "Screening" });
  });

  it("requires a scheduled date on the when step", () => {
    const date = new Date("2026-09-06T12:00:00.000Z");
    expect(
      eventWhenSchema.parse({ scheduledDate: date, duration: 30 }),
    ).toEqual({ scheduledDate: date, duration: 30 });
  });

  it("allows an empty meeting link", () => {
    expect(
      eventWhereSchema.parse({
        isVirtual: true,
        meetingLink: "",
      }),
    ).toMatchObject({ isVirtual: true, meetingLink: "" });
  });
});
