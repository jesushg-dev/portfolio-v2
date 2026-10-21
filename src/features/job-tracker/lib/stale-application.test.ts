import {
  computeLastActivityAt,
  isArchivedGhost,
  isSuggestedGhost,
} from "./stale-application";

const now = new Date("2026-09-01T12:00:00.000Z");

describe("stale-application", () => {
  it("suggests ghost after 21 days with no later event", () => {
    expect(
      isSuggestedGhost(
        {
          status: "APPLIED",
          lastActivityAt: new Date("2026-08-01T12:00:00.000Z"),
        },
        now,
      ),
    ).toBe(true);
  });

  it("does not suggest ghost when an interview is still upcoming", () => {
    expect(
      isSuggestedGhost(
        {
          status: "APPLIED",
          lastActivityAt: new Date("2026-09-10T12:00:00.000Z"),
        },
        now,
      ),
    ).toBe(false);
  });

  it("uses the latest event as last activity", () => {
    const last = computeLastActivityAt(new Date("2026-07-01T00:00:00.000Z"), [
      { scheduledDate: new Date("2026-08-20T00:00:00.000Z") },
    ]);
    expect(last.toISOString()).toBe("2026-08-20T00:00:00.000Z");
  });

  it("does not suggest again while snoozed", () => {
    expect(
      isSuggestedGhost(
        {
          status: "APPLIED",
          lastActivityAt: new Date("2026-08-01T12:00:00.000Z"),
          ghostNudgeSnoozedUntil: new Date("2026-09-08T12:00:00.000Z"),
        },
        now,
      ),
    ).toBe(false);
  });

  it("suggests again after the snooze date", () => {
    expect(
      isSuggestedGhost(
        {
          status: "APPLIED",
          lastActivityAt: new Date("2026-08-01T12:00:00.000Z"),
          ghostNudgeSnoozedUntil: new Date("2026-08-20T12:00:00.000Z"),
        },
        now,
      ),
    ).toBe(true);
  });

  it("archives ghosts after 30 days", () => {
    expect(
      isArchivedGhost(
        {
          status: "GHOSTED",
          updatedAt: new Date("2026-07-01T12:00:00.000Z"),
        },
        now,
      ),
    ).toBe(true);
  });
});
