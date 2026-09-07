jest.mock("@/features/job-tracker/lib/ai/run-draft-application-email", () => ({
  draftApplicationEmailWithAi: jest.fn(),
}));
jest.mock(
  "@/features/job-tracker/lib/ai/run-draft-application-cover-letter",
  () => ({
    draftApplicationCoverLetterWithAi: jest.fn(),
  }),
);
jest.mock("@/features/resume-engine/lib/ai/providers", () => ({
  getDefaultAiProvider: jest.fn(),
  loadTenantAiCredentials: jest.fn(),
}));
jest.mock("@/lib/google-calendar/sync", () => ({
  deleteApplicationEventFromGoogleCalendar: jest.fn(),
  pullLinkedUpcomingEventsFromGoogle: jest.fn(),
  pushApplicationEventToGoogleCalendar: jest.fn(),
  updateApplicationEventOnGoogleCalendar: jest.fn(),
}));
jest.mock("@/lib/google-calendar/connection", () => ({
  getGoogleCalendarConnectionForUser: jest.fn(),
}));
jest.mock("@/features/job-tracker/lib/import-job-from-url", () => ({
  importJobFromUrl: jest.fn(),
}));

import { importJobFromUrl } from "@/features/job-tracker/lib/import-job-from-url";
import { pullLinkedUpcomingEventsFromGoogle } from "@/lib/google-calendar/sync";
import { getGoogleCalendarConnectionForUser } from "@/lib/google-calendar/connection";
import { jobTrackerAdminRouter } from "./job-tracker-admin.router";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

const company = {
  id: "co-1",
  name: "Acme",
  email: "jobs@acme.com",
  website: "https://acme.com",
  description: "Widgets",
  userId: MOCK_OWNER_USER.id,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("jobTrackerAdminRouter", () => {
  it("lists companies and dashboard stats", async () => {
    const db = {
      company: {
        findMany: jest.fn().mockResolvedValue([company]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(company),
        delete: jest.fn().mockResolvedValue(company),
      },
      application: {
        count: jest.fn().mockResolvedValue(4),
        groupBy: jest.fn().mockResolvedValue([
          { status: "APPLIED", _count: 2 },
          { status: "INTERVIEW", _count: 1 },
          { status: "HIRED", _count: 1 },
        ]),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const caller = createRouterCaller(
      jobTrackerAdminRouter,
      createTrpcTestContext({ db }),
    );

    const companies = await caller.getCompanies({
      page: 1,
      perPage: 10,
      sort: [{ id: "name", desc: false }],
      filters: [],
    });
    expect(companies.data[0]?.name).toBe("Acme");

    const stats = await caller.getDashboardStats();
    expect(stats).toMatchObject({
      totalApplications: 4,
      totalCompanies: 1,
      applied: 2,
      inProgress: 1,
      hired: 1,
    });

    const created = await caller.createCompany({
      name: "Acme",
      email: "jobs@acme.com",
      website: "https://acme.com",
      description: "Widgets",
    });
    expect(created.id).toBe("co-1");
  });

  it("throws when an application is missing", async () => {
    const caller = createRouterCaller(
      jobTrackerAdminRouter,
      createTrpcTestContext({
        db: {
          application: { findUnique: jest.fn().mockResolvedValue(null) },
        },
      }),
    );
    await expect(
      caller.getApplicationById({ id: "missing" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("creates, updates, and bulk-updates applications", async () => {
    const application = {
      id: "app-1",
      position: "Engineer",
      description: "Build things",
      companyId: "co-1",
      status: "APPLIED",
      appliedDate: new Date("2026-01-01"),
      salary: "100k",
      location: "Remote",
      notes: "",
      cvFile: null,
      userId: MOCK_OWNER_USER.id,
    };
    const db = {
      application: {
        create: jest.fn().mockResolvedValue(application),
        update: jest
          .fn()
          .mockResolvedValue({ ...application, status: "INTERVIEW" }),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
        delete: jest.fn().mockResolvedValue(application),
      },
    };
    const caller = createRouterCaller(
      jobTrackerAdminRouter,
      createTrpcTestContext({ db }),
    );

    const created = await caller.createApplication({
      position: "Engineer",
      companyId: "co-1",
      status: "APPLIED",
      appliedDate: new Date("2026-01-01"),
      salary: "100k",
      location: "Remote",
    });
    expect(created.position).toBe("Engineer");

    await caller.updateApplication({
      id: "app-1",
      status: "INTERVIEW",
    });
    await caller.updateApplicationStatus({ id: "app-1", status: "GHOSTED" });
    await caller.updateApplicationStatuses({
      ids: ["app-1", "app-2"],
      status: "REJECTED",
    });
    const snoozed = await caller.snoozeGhostNudge({ ids: ["app-1"], days: 7 });
    expect(snoozed.count).toBe(2);
    await caller.deleteApplication({ id: "app-1" });
    expect(db.application.delete).toHaveBeenCalled();
  });

  it("creates an event and reports calendar sync status", async () => {
    jest.mocked(pullLinkedUpcomingEventsFromGoogle).mockResolvedValue([]);
    jest.mocked(getGoogleCalendarConnectionForUser).mockResolvedValue(null);

    const scheduledDate = new Date("2099-01-01T10:00:00.000Z");
    const event = {
      id: "ev-1",
      title: "Intro",
      description: null,
      scheduledDate,
      duration: 30,
      location: null,
      meetingLink: null,
      completed: false,
      googleEventId: null,
      googleEtag: null,
      application: {
        id: "app-1",
        position: "Engineer",
        company: { name: "Acme" },
      },
    };
    const db = {
      applicationEvent: {
        create: jest.fn().mockResolvedValue(event),
        findMany: jest.fn().mockResolvedValue([event]),
      },
    };
    const caller = createRouterCaller(
      jobTrackerAdminRouter,
      createTrpcTestContext({ db }),
    );

    const created = await caller.createEvent({
      applicationId: "app-1",
      type: "INTERVIEW",
      title: "Intro",
      scheduledDate,
      duration: 30,
    });
    expect(created.id).toBe("ev-1");

    const upcoming = await caller.getUpcomingEvents({ limit: 5 });
    expect(upcoming).toHaveLength(1);

    await expect(caller.getGoogleCalendarSyncStatus()).resolves.toEqual({
      connected: false,
    });
  });

  it("imports a job from a URL", async () => {
    jest.mocked(importJobFromUrl).mockResolvedValue({
      position: "Engineer",
      companyName: "Acme",
    } as never);
    const caller = createRouterCaller(
      jobTrackerAdminRouter,
      createTrpcTestContext({ db: {} }),
    );
    await expect(
      caller.importFromUrl({ url: "https://jobs.example/role" }),
    ).resolves.toMatchObject({ position: "Engineer" });
  });
});
