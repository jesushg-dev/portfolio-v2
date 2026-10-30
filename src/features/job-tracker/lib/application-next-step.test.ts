import {
  addBusinessDays,
  getApplicationNextStep,
} from "./application-next-step";
import type { ApplicationDetail } from "@/features/job-tracker/types";

const base = {
  status: "APPLIED",
  appliedDate: new Date("2026-10-23T12:00:00Z"),
  events: [],
  cvFile: {
    name: "cv.pdf",
    url: "https://example.com/cv.pdf",
    uploadedAt: new Date(),
  },
} as Pick<ApplicationDetail, "status" | "appliedDate" | "events" | "cvFile">;

describe("application next step", () => {
  it("counts five working days without changing the kanban ghost rule", () => {
    expect(addBusinessDays(new Date("2026-10-23T12:00:00Z"), 5)).toEqual(
      new Date("2026-10-30T12:00:00Z"),
    );
    expect(
      getApplicationNextStep(base, new Date("2026-10-29T12:00:00Z")),
    ).toMatchObject({
      kind: "follow-up",
      overdue: false,
    });
    expect(
      getApplicationNextStep(base, new Date("2026-10-30T12:00:00Z")),
    ).toMatchObject({
      kind: "follow-up",
      overdue: true,
    });
  });

  it("prioritizes an upcoming event over a generic status nudge", () => {
    const application = {
      ...base,
      status: "INTERVIEW" as const,
      events: [
        {
          id: "event-1",
          type: "TECHNICAL_TEST",
          scheduledDate: new Date("2026-10-29T12:00:00Z"),
          completed: false,
        },
      ] as ApplicationDetail["events"],
    };
    expect(getApplicationNextStep(application)).toMatchObject({
      kind: "pending-event",
      eventId: "event-1",
    });
  });
});
