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
jest.mock("@/features/cv/lib/load-cv-structured-draft", () => ({
  loadCvStructuredDraft: jest.fn(),
}));
jest.mock("@/lib/email/resend", () => ({
  getPortfolioEmailClient: jest.fn(),
}));
jest.mock("@/lib/integrations/tenant-integrations-service", () => ({
  getTenantIntegrationConfig: jest.fn(),
}));

import { importJobFromUrl } from "@/features/job-tracker/lib/import-job-from-url";
import { loadCvStructuredDraft } from "@/features/cv/lib/load-cv-structured-draft";
import { getPortfolioEmailClient } from "@/lib/email/resend";
import { getTenantIntegrationConfig } from "@/lib/integrations/tenant-integrations-service";
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
  linkedinUrl: "https://linkedin.com/company/acme",
  location: "Remote",
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
      linkedinUrl: "https://linkedin.com/company/acme",
      location: "Remote",
      description: "Widgets",
    });
    expect(created.id).toBe("co-1");
    expect(created.linkedinUrl).toBe("https://linkedin.com/company/acme");
    expect(created.location).toBe("Remote");
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
      jobUrl: "https://example.com/job/1",
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
      jobUrl: "https://example.com/job/1",
    });
    expect(created.position).toBe("Engineer");
    expect(created.jobUrl).toBe("https://example.com/job/1");

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

  it("returns only the current user's sent-email history without token data", async () => {
    const sentAt = new Date("2026-10-01T12:00:00.000Z");
    const historyRecord = {
      id: "mail-1",
      recipientEmail: "jobs@acme.com",
      subject: "Application",
      attachmentName: "cv.pdf",
      trackingEnabled: true,
      openCount: 3,
      firstOpenedAt: new Date("2026-10-01T13:00:00.000Z"),
      lastOpenedAt: new Date("2026-10-01T14:00:00.000Z"),
      sentAt,
    };
    const findMany = jest.fn().mockResolvedValue([historyRecord]);
    const caller = createRouterCaller(
      jobTrackerAdminRouter,
      createTrpcTestContext({
        db: { applicationEmail: { findMany } },
      }),
    );

    const result = await caller.getApplicationEmailHistory({
      applicationId: "app-1",
    });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        applicationId: "app-1",
        userId: MOCK_OWNER_USER.id,
        sentAt: { not: null },
      },
      select: {
        id: true,
        recipientEmail: true,
        subject: true,
        attachmentName: true,
        trackingEnabled: true,
        openCount: true,
        firstOpenedAt: true,
        lastOpenedAt: true,
        sentAt: true,
        opens: {
          select: {
            id: true,
            openedAt: true,
            userAgent: true,
            ipAddress: true,
          },
          orderBy: { openedAt: "desc" },
        },
      },
      orderBy: { sentAt: "desc" },
    });
    expect(result).toEqual([historyRecord]);
    expect(result[0]).not.toHaveProperty("trackingTokenHash");
  });

  it("adds a disclosed tracking pixel only when requested for a CV email", async () => {
    interface MockEmailMessage {
      to: string;
      subject: string;
      text: string;
      html: string;
      attachments?: { filename: string; content: Buffer }[];
    }

    const send = jest.fn(
      (
        _message: MockEmailMessage,
        _options: { idempotencyKey: string },
      ) => {
        void _message;
        void _options;
        return Promise.resolve({
          data: { id: "resend-1" },
          error: null,
        });
      },
    );
    jest.mocked(getPortfolioEmailClient).mockResolvedValue({
      isConfigured: true,
      fromEmail: "candidate@example.com",
      resend: { emails: { send } },
    } as never);
    jest.mocked(getTenantIntegrationConfig).mockResolvedValue(null);
    jest.mocked(loadCvStructuredDraft).mockResolvedValue({
      header: { fullName: "Candidate" },
      contacts: [],
    } as never);
    const previousFetch = Reflect.get(globalThis, "fetch") as
      typeof fetch | undefined;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
    });
    Reflect.set(globalThis, "fetch", fetchMock);
    const previousBaseUrl = process.env.BETTER_AUTH_URL;
    process.env.BETTER_AUTH_URL = "https://portfolio.example";
    const emailRecord = {
      id: "mail-1",
      trackingEnabled: true,
      trackingTokenHash: "stored-hash",
      sentAt: null,
    };
    const applicationEmail = {
      upsert: jest
        .fn()
        .mockResolvedValueOnce(emailRecord)
        .mockResolvedValueOnce({
          id: "mail-2",
          trackingEnabled: false,
          trackingTokenHash: null,
          sentAt: null,
        }),
      update: jest.fn().mockResolvedValue(emailRecord),
    };
    const caller = createRouterCaller(
      jobTrackerAdminRouter,
      createTrpcTestContext({
        db: {
          application: {
            findFirst: jest.fn().mockResolvedValue({
              id: "app-1",
              companyId: "co-1",
              cvFile: { url: "https://files.example/cv.pdf", name: "cv.pdf" },
              company: { id: "co-1", email: "jobs@acme.com" },
            }),
          },
          applicationEmail,
          applicationEvent: { create: jest.fn().mockResolvedValue({}) },
        },
      }),
    );

    try {
      const result = await caller.sendApplicationEmail({
        applicationId: "app-1",
        toEmail: "jobs@acme.com",
        subject: "Application",
        body: "Hello,\nthere.\n\nPlease find my CV attached.",
        trackOpens: true,
        locale: "es",
      });

      expect(result.emailId).toBe("resend-1");
      expect(result.copySent).toBe(true);
      expect(applicationEmail.upsert).toHaveBeenCalledTimes(1);
      const sentMessage = send.mock.calls[0]?.[0];
      expect(sentMessage?.text).not.toContain("imagen de seguimiento");
      expect(sentMessage?.html).not.toContain("imagen de seguimiento");
      expect(sentMessage?.html).toContain("Hello,<br />there.");
      expect(sentMessage?.html).not.toContain("&nbsp;");
      const sentHtml = sentMessage?.html ?? "";
      expect(sentHtml).toContain(
        "https://portfolio.example/api/job-tracker/email-open?token=",
      );
      expect(applicationEmail.update).toHaveBeenCalledTimes(1);

      const copyMessage = send.mock.calls[1]?.[0];
      expect(copyMessage?.to).toBe("owner@example.com");
      expect(copyMessage?.subject).toBe("Application");
      expect(copyMessage?.html).not.toContain("email-open?token=");
      expect(copyMessage?.html).toContain("Hello,<br />there.");
      expect(copyMessage?.attachments?.[0]?.filename).toBe("cv.pdf");

      await caller.sendApplicationEmail({
        applicationId: "app-1",
        toEmail: "jobs@acme.com",
        subject: "Follow-up",
        body: "Following up on my application.",
        locale: "en",
        sendCopy: false,
      });
      const untrackedMessage = send.mock.calls[2]?.[0];
      expect(untrackedMessage?.to).toBe("jobs@acme.com");
      expect(untrackedMessage?.html).not.toContain("email-open?token=");
      expect(untrackedMessage?.text).not.toContain("tracking image");
      expect(send.mock.calls).toHaveLength(3);
      expect(applicationEmail.upsert).toHaveBeenCalledTimes(2);
      expect(applicationEmail.update).toHaveBeenCalledTimes(2);
    } finally {
      if (previousFetch) {
        Reflect.set(globalThis, "fetch", previousFetch);
      } else {
        Reflect.deleteProperty(globalThis, "fetch");
      }
      if (previousBaseUrl === undefined) {
        delete process.env.BETTER_AUTH_URL;
      } else {
        process.env.BETTER_AUTH_URL = previousBaseUrl;
      }
    }
  });

  it("aggregates email tracking data for getEmailTrackingHub", async () => {
    const sentDate = new Date("2026-08-01T10:00:00Z");
    const openDate = new Date("2026-08-01T12:00:00Z");
    const db = {
      applicationEmail: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "email-1",
            applicationId: "app-1",
            recipientEmail: "hiring@acme.com",
            subject: "Application for Frontend Lead",
            attachmentName: "CV.pdf",
            trackingEnabled: true,
            openCount: 2,
            firstOpenedAt: openDate,
            lastOpenedAt: openDate,
            sentAt: sentDate,
            application: {
              id: "app-1",
              position: "Frontend Lead",
              status: "APPLIED",
              appliedDate: sentDate,
              company: {
                id: "co-1",
                name: "Acme",
                location: "Remote",
              },
            },
            opens: [
              {
                id: "open-1",
                openedAt: openDate,
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                ipAddress: "192.168.1.1",
              },
            ],
          },
        ]),
      },
      applicationEmailOpen: {
        count: jest.fn().mockResolvedValue(1),
      },
    };

    const ctx = createTrpcTestContext({ db });
    const caller = createRouterCaller(jobTrackerAdminRouter, ctx);
    const result = await caller.getEmailTrackingHub();

    expect(result.stats).toEqual({
      totalSent: 1,
      totalTracked: 1,
      totalOpens: 2,
      openRate: 100,
      recentOpens24h: 1,
    });
    expect(result.applications).toHaveLength(1);
    expect(result.applications[0]?.position).toBe("Frontend Lead");
    expect(result.applications[0]?.company.name).toBe("Acme");
    expect(result.applications[0]?.totalOpens).toBe(2);
  });
});
