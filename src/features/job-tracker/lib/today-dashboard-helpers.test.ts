import {
  businessDaysBetween,
  calendarDaysBetween,
  getFunnelMetrics,
  getPendingFollowUps,
  getSuggestedClosures,
  getWeeklyTimeline,
} from "./today-dashboard-helpers";
import type {
  ApplicationListRow,
  UpcomingEvent,
} from "@/features/job-tracker/types";

function createMockApplication(
  partial: Partial<ApplicationListRow>,
): ApplicationListRow {
  return {
    id: "app-1",
    position: "Software Engineer",
    companyId: "comp-1",
    company: {
      id: "comp-1",
      name: "Acme Corp",
      email: "recruiter@acme.com",
      website: "https://acme.com",
      linkedinUrl: "",
      location: "",
      description: "",
    },
    status: "APPLIED",
    appliedDate: new Date("2026-10-20"),
    updatedAt: new Date("2026-10-20"),
    lastActivityAt: new Date("2026-10-20"),
    ghostNudgeSnoozedUntil: null,
    salary: "$100k",
    location: "Remote",
    jobUrl: "https://acme.com/jobs/1",
    notes: "",
    description: "",
    ...partial,
  };
}

describe("today-dashboard-helpers", () => {
  it("calculates calendar days correctly", () => {
    expect(
      calendarDaysBetween("2026-10-20", new Date("2026-10-25T12:00:00Z")),
    ).toBe(5);
    expect(
      calendarDaysBetween("2026-10-25", new Date("2026-10-20T12:00:00Z")),
    ).toBe(0);
  });

  it("calculates business days excluding weekends", () => {
    // 2026-10-23 is Friday. 2026-10-26 is Monday. That's 1 business day.
    expect(
      businessDaysBetween("2026-10-23", new Date("2026-10-26T12:00:00Z")),
    ).toBe(1);
    // 2026-10-23 (Fri) to 2026-10-30 (Fri) is 5 business days.
    expect(
      businessDaysBetween("2026-10-23", new Date("2026-10-30T12:00:00Z")),
    ).toBe(5);
  });

  it("identifies pending follow ups overdue by 5 business days", () => {
    const now = new Date("2026-10-28T12:00:00Z");
    const appOverdue = createMockApplication({
      id: "app-overdue",
      appliedDate: new Date("2026-10-15T12:00:00Z"), // > 5 business days
      status: "APPLIED",
    });
    const appRecent = createMockApplication({
      id: "app-recent",
      appliedDate: new Date("2026-10-27T12:00:00Z"), // 1 business day
      status: "APPLIED",
    });
    const appSnoozed = createMockApplication({
      id: "app-snoozed",
      appliedDate: new Date("2026-10-15T12:00:00Z"),
      status: "APPLIED",
      ghostNudgeSnoozedUntil: new Date("2026-11-01T12:00:00Z"), // snoozed
    });

    const pending = getPendingFollowUps(
      [appOverdue, appRecent, appSnoozed],
      now,
    );
    expect(pending).toHaveLength(1);
    expect(pending[0].application.id).toBe("app-overdue");
  });

  it("identifies suggested closures for ghosted applications 30+ days old", () => {
    const now = new Date("2026-10-28T12:00:00Z");
    const appGhostedOld = createMockApplication({
      id: "app-ghost-old",
      status: "GHOSTED",
      updatedAt: new Date("2026-09-10T12:00:00Z"), // > 30 days
    });
    const appGhostedFresh = createMockApplication({
      id: "app-ghost-fresh",
      status: "GHOSTED",
      updatedAt: new Date("2026-10-20T12:00:00Z"), // 8 days
    });

    const closures = getSuggestedClosures(
      [appGhostedOld, appGhostedFresh],
      now,
    );
    expect(closures).toHaveLength(1);
    expect(closures[0].application.id).toBe("app-ghost-old");
  });

  it("generates 7-day weekly timeline with events and projected follow-ups", () => {
    const now = new Date("2026-10-28T10:00:00Z"); // Wednesday
    const events: UpcomingEvent[] = [
      {
        id: "ev-1",
        title: "Tech Interview",
        type: "INTERVIEW",
        description: null,
        scheduledDate: new Date("2026-10-28T14:00:00Z"),
        duration: 60,
        location: null,
        isVirtual: true,
        meetingLink: "https://meet.google.com/abc",
        application: {
          id: "app-1",
          position: "Frontend Dev",
          company: { name: "TechCorp" },
        },
      },
    ];

    const timeline = getWeeklyTimeline(events, [], now);
    expect(timeline).toHaveLength(7);
    expect(timeline[0].isToday).toBe(true);
    expect(timeline[0].events).toHaveLength(1);
    expect(timeline[1].isTomorrow).toBe(true);
  });

  it("calculates funnel conversion metrics correctly", () => {
    const apps = [
      createMockApplication({ status: "APPLIED" }),
      createMockApplication({ status: "APPLIED" }),
      createMockApplication({ status: "INTERVIEW" }),
      createMockApplication({ status: "OFFER" }),
      createMockApplication({ status: "REJECTED" }),
    ];

    const funnel = getFunnelMetrics(apps);
    expect(funnel.total).toBe(5);
    // Responded: INTERVIEW, OFFER, REJECTED = 3 (60%)
    expect(funnel.responded).toBe(3);
    expect(funnel.respondedRate).toBe(60);
    // Interviews: INTERVIEW, OFFER = 2 (40%)
    expect(funnel.interviews).toBe(2);
    expect(funnel.interviewRate).toBe(40);
    // Offers: OFFER = 1 (20%)
    expect(funnel.offers).toBe(1);
    expect(funnel.offerRate).toBe(20);
  });
});
