import {
  getApplicationCreatePageData,
  getApplicationDetailPageData,
  getApplicationEditPageData,
  getApplicationsListData,
  getCompaniesListData,
  getCompanyCreatePageData,
  getCompanyEditPageData,
  getDashboardStatsData,
  getEventCreatePageData,
  getUpcomingEventsData,
} from "./job-tracker-queries";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

jest.mock("@/lib/admin/get-authenticated-user-id", () => ({
  assertNonEmptyUserId: jest.fn(),
  requireAuthenticatedUserId: jest.fn(),
}));

jest.mock("@/lib/google-calendar/sync", () => ({
  pullLinkedUpcomingEventsFromGoogle: jest.fn(),
}));

jest.mock("@/server/db", () => ({
  db: {
    application: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    company: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    applicationEvent: {
      findMany: jest.fn(),
    },
  },
}));

import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import { pullLinkedUpcomingEventsFromGoogle } from "@/lib/google-calendar/sync";
import { db } from "@/server/db";

const company = {
  id: "co-1",
  name: "Acme",
  email: "jobs@acme.com",
  website: "",
  description: "",
  userId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const application = {
  id: "app-1",
  position: "Engineer",
  description: "",
  companyId: "co-1",
  status: "APPLIED",
  appliedDate: new Date("2026-08-01"),
  salary: "",
  location: "",
  notes: "",
  cvFile: null,
  userId: "user-1",
  updatedAt: new Date("2026-08-02"),
  ghostNudgeSnoozedUntil: null,
  coverLetterSubject: null,
  coverLetterBody: null,
  createdAt: new Date("2026-08-01"),
  company,
  events: [],
};

describe("job-tracker-queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuthenticatedUserId as jest.Mock).mockResolvedValue("user-1");
  });

  it("aggregates dashboard stats by status", async () => {
    (db.application.count as jest.Mock).mockResolvedValue(4);
    (db.company.count as jest.Mock).mockResolvedValue(2);
    (db.application.groupBy as jest.Mock).mockResolvedValue([
      { status: "APPLIED", _count: 2 },
      { status: "OFFER", _count: 1 },
      { status: "HIRED", _count: 1 },
    ]);

    await expect(getDashboardStatsData()).resolves.toMatchObject({
      totalApplications: 4,
      totalCompanies: 2,
      applied: 2,
      offers: 1,
      hired: 1,
      inProgress: 0,
    });
  });

  it("merges upcoming events with Google pulls", async () => {
    (db.applicationEvent.findMany as jest.Mock).mockResolvedValue([
      {
        id: "evt-1",
        type: "INTERVIEW",
        title: "Screen",
        description: null,
        scheduledDate: new Date("2026-10-01"),
        duration: 30,
        location: null,
        isVirtual: true,
        meetingLink: null,
        googleEventId: "g1",
        googleEtag: "e1",
        application: {
          id: "app-1",
          position: "Engineer",
          company: { name: "Acme" },
        },
      },
    ]);
    (pullLinkedUpcomingEventsFromGoogle as jest.Mock).mockResolvedValue([
      {
        id: "evt-1",
        title: "Screen (synced)",
        scheduledDate: new Date("2026-10-02"),
        duration: 45,
        location: "Zoom",
        meetingLink: "https://zoom.example",
      },
    ]);

    const events = await getUpcomingEventsData(5);
    expect(events[0]?.title).toBe("Screen (synced)");
    expect(events[0]?.meetingLink).toBe("https://zoom.example");
  });

  it("lists applications and companies with filters", async () => {
    (db.application.findMany as jest.Mock).mockResolvedValue([application]);
    (db.application.count as jest.Mock).mockResolvedValue(1);
    (db.company.findMany as jest.Mock).mockResolvedValue([company]);
    (db.company.count as jest.Mock).mockResolvedValue(1);

    const apps = await getApplicationsListData({
      page: 1,
      perPage: 10,
      sort: [{ id: "position", desc: false }],
      filters: [
        {
          id: "position",
          value: "Eng",
          variant: "text",
          operator: "iLike",
          filterId: "f1",
        },
      ],
    });
    expect(apps.totalCount).toBe(1);

    const companies = await getCompaniesListData({
      page: 1,
      perPage: 10,
      sort: [{ id: "name", desc: true }],
      filters: [],
    });
    expect(companies.data[0]?.name).toBe("Acme");
  });

  it("loads create/edit/detail pages", async () => {
    (db.company.findMany as jest.Mock).mockResolvedValue([company]);
    (db.application.findUnique as jest.Mock).mockResolvedValue(application);
    (db.company.findUnique as jest.Mock).mockResolvedValue(company);
    (db.application.findMany as jest.Mock).mockResolvedValue([application]);

    const create = await getApplicationCreatePageData();
    expect(create.initialData.status).toBe("APPLIED");

    const edit = await getApplicationEditPageData("app-1");
    expect(edit.editorDto.id).toBe("app-1");

    const detail = await getApplicationDetailPageData("app-1");
    expect(detail.position).toBe("Engineer");

    expect(getCompanyCreatePageData().initialData.name).toBe("");
    const companyEdit = await getCompanyEditPageData("co-1");
    expect(companyEdit.editorDto.id).toBe("co-1");

    const eventCreate = await getEventCreatePageData("app-1");
    expect(eventCreate.initialData.applicationId).toBe("app-1");
  });

  it("calls notFound when an application is missing", async () => {
    (db.application.findUnique as jest.Mock).mockResolvedValue(null);
    (db.company.findMany as jest.Mock).mockResolvedValue([]);
    await expect(getApplicationEditPageData("missing")).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
