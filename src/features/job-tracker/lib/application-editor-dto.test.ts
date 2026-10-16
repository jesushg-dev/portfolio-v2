import {
  buildEmptyApplicationCreateDto,
  mapApplicationToDetailDto,
  mapApplicationToEditorDto,
  mapApplicationsToListDto,
} from "./application-editor-dto";
import type { Application, ApplicationEvent, Company } from "@prisma/client";

const company = {
  id: "co-1",
  name: "Acme",
  email: "jobs@acme.com",
  website: "https://acme.com",
  description: "Widgets",
  userId: "user-1",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
} as Company;

const application = {
  id: "app-1",
  position: "Engineer",
  description: "Build things",
  companyId: "co-1",
  status: "INTERVIEW",
  appliedDate: new Date("2026-08-01"),
  salary: "120k",
  location: "Remote",
  jobUrl: "https://example.com/jobs/1",
  notes: "Nice team",
  cvFile: {
    name: "cv.pdf",
    url: "https://cdn.example/cv.pdf",
    uploadedAt: new Date("2026-08-01"),
  },
  userId: "user-1",
  updatedAt: new Date("2026-08-02"),
  ghostNudgeSnoozedUntil: null,
  coverLetterSubject: "Hello",
  coverLetterBody: "Please find attached",
  createdAt: new Date("2026-08-01"),
} as Application;

describe("application editor dto", () => {
  it("maps editor fields including the CV file and jobUrl", () => {
    const dto = mapApplicationToEditorDto(application);
    expect(dto.position).toBe("Engineer");
    expect(dto.jobUrl).toBe("https://example.com/jobs/1");
    expect(dto.cvFile?.name).toBe("cv.pdf");
    expect(dto.status).toBe("INTERVIEW");
  });

  it("maps list rows with company and activity", () => {
    const [row] = mapApplicationsToListDto([
      {
        ...application,
        company,
        events: [],
      },
    ]);
    expect(row.company.name).toBe("Acme");
    expect(row.lastActivityAt).toBeInstanceOf(Date);
    expect(row.emailSummary).toBeUndefined();
  });

  it("maps list rows with emailSummary when sent emails are present", () => {
    const [row] = mapApplicationsToListDto([
      {
        ...application,
        company,
        events: [],
        emails: [
          {
            id: "email-1",
            sentAt: new Date("2026-08-01T10:00:00Z"),
            openCount: 2,
            firstOpenedAt: new Date("2026-08-01T11:00:00Z"),
            lastOpenedAt: new Date("2026-08-01T12:00:00Z"),
            trackingEnabled: true,
          },
        ],
      },
    ]);
    expect(row.emailSummary).toEqual({
      totalSent: 1,
      totalOpens: 2,
      lastOpenedAt: new Date("2026-08-01T12:00:00Z"),
      hasTracking: true,
    });
  });

  it("maps detail events and cover letter", () => {
    const event = {
      id: "evt-1",
      applicationId: "app-1",
      userId: "user-1",
      type: "INTERVIEW",
      title: "Screen",
      scheduledDate: new Date("2026-09-01"),
    } as ApplicationEvent;

    const detail = mapApplicationToDetailDto({
      ...application,
      company,
      events: [event],
    });
    expect(detail.events).toHaveLength(1);
    expect(detail.coverLetterSubject).toBe("Hello");
  });

  it("builds an empty create dto", () => {
    const dto = buildEmptyApplicationCreateDto();
    expect(dto.status).toBe("APPLIED");
    expect(dto.position).toBe("");
  });
});
