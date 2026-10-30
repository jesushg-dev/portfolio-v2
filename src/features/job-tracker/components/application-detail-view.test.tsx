import { screen, fireEvent, within } from "@testing-library/react";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { ApplicationDetailView } from "./application-detail-view";
import type { ApplicationDetail } from "@/features/job-tracker/types";

const mockDeleteMutateAsync = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    refresh: jest.fn(),
  }),
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: unknown;
    className?: string;
  }) => (
    <a
      href={typeof href === "string" ? href : JSON.stringify(href)}
      className={className}
    >
      {children}
    </a>
  ),
}));

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      jobTrackerAdmin: {
        getApplications: { invalidate: jest.fn() },
        getDashboardStats: { invalidate: jest.fn() },
        getApplicationEmailHistory: { invalidate: jest.fn() },
      },
    }),
    jobTrackerAdmin: {
      getApplicationEmailHistory: {
        useQuery: () => ({
          data: [],
          isLoading: false,
          isFetching: false,
          isError: false,
          refetch: jest.fn(),
        }),
      },
      deleteApplication: {
        useMutation: () => ({
          mutateAsync: mockDeleteMutateAsync,
          isPending: false,
        }),
      },
      updateApplicationStatus: {
        useMutation: () => ({ mutateAsync: jest.fn(), isPending: false }),
      },
      updateApplication: {
        useMutation: () => ({ mutateAsync: jest.fn(), isPending: false }),
      },
      closeJobSearch: {
        useMutation: () => ({ mutateAsync: jest.fn(), isPending: false }),
      },
      snoozeGhostNudge: {
        useMutation: () => ({ mutateAsync: jest.fn(), isPending: false }),
      },
    },
  },
}));

jest.mock("@/features/job-tracker/components/application-timeline", () => ({
  ApplicationTimeline: () => (
    <div data-testid="application-timeline-mock">Timeline View</div>
  ),
}));

jest.mock(
  "@/features/job-tracker/components/application-event-result-dialog",
  () => ({
    ApplicationEventResultDialog: () => null,
  }),
);

jest.mock("@/features/resume-engine/components/resume-tailor-workflow", () => ({
  ResumeTailorWorkflow: () => (
    <div data-testid="resume-tailor-workflow-mock">Tailor CV View</div>
  ),
}));

jest.mock("@/features/job-tracker/components/application-email-panel", () => ({
  ApplicationEmailDialog: () => null,
}));

jest.mock(
  "@/features/job-tracker/components/application-cover-letter-panel",
  () => ({
    ApplicationCoverLetterDialog: () => null,
  }),
);

jest.mock("@/components/shared/confirm-dialog", () => ({
  ConfirmDialog: () => null,
}));

const mockApplication: ApplicationDetail = {
  id: "app-123",
  position: "Backend Developer",
  companyId: "comp-1",
  status: "REJECTED",
  appliedDate: new Date("2026-08-27T10:00:00Z"),
  salary: "$4,000 USD",
  location: "100% Remote",
  jobUrl: "https://example.com/job",
  description: "Senior backend developer with .NET & AWS experience.",
  notes: "Applied directly on site.",
  coverLetterSubject: "Application for Backend Developer",
  coverLetterBody: "Dear Hiring Manager...",
  updatedAt: new Date("2026-08-27T10:00:00Z"),
  lastActivityAt: new Date("2026-08-27T10:00:00Z"),
  ghostNudgeSnoozedUntil: null,
  company: {
    id: "comp-1",
    name: "Ready",
    website: "https://ready.example.com",
    linkedinUrl: "https://linkedin.com/company/ready",
    location: "United States",
    email: "carol@joinready.com",
    description: "Fintech company",
  },
  events: [],
  cvFile: {
    name: "Jesus_Hernandez_CV.pdf",
    url: "https://example.com/cv.pdf",
    uploadedAt: new Date("2026-08-27T10:00:00Z"),
  },
};

describe("ApplicationDetailView", () => {
  it("renders the position, company, status badge, and mobile tab controls", () => {
    renderWithIntl(
      <ApplicationDetailView
        application={mockApplication}
        locale="en"
        defaultTab="details"
      />,
    );

    expect(screen.getByText("Backend Developer")).toBeInTheDocument();
    expect(screen.getAllByText("Ready").length).toBeGreaterThan(0);

    const tabsNavs = screen.getAllByRole("navigation", {
      name: "Application sections",
    });
    const mobileNav = tabsNavs[0];
    expect(
      within(mobileNav).getByRole("tab", { name: "Details" }),
    ).toBeInTheDocument();
    expect(
      within(mobileNav).getByRole("tab", { name: "Timeline" }),
    ).toBeInTheDocument();
    expect(
      within(mobileNav).getByRole("tab", { name: "Tailor CV" }),
    ).toBeInTheDocument();
    expect(
      within(mobileNav).getByRole("tab", { name: "Emails" }),
    ).toBeInTheDocument();
  });

  it("switches mobile views when tapping tabs", () => {
    renderWithIntl(
      <ApplicationDetailView
        application={mockApplication}
        locale="en"
        defaultTab="details"
      />,
    );

    const tabsNavs = screen.getAllByRole("navigation", {
      name: "Application sections",
    });
    const mobileNav = tabsNavs[0];

    // Initial state: details tab is active
    expect(screen.getAllByText("Job description").length).toBeGreaterThan(0);

    // Click Timeline tab in mobile nav
    fireEvent.click(within(mobileNav).getByRole("tab", { name: "Timeline" }));
    expect(
      screen.getAllByTestId("application-timeline-mock").length,
    ).toBeGreaterThan(0);

    // Click Tailor CV tab in mobile nav
    fireEvent.click(within(mobileNav).getByRole("tab", { name: "Tailor CV" }));
    expect(
      screen.getAllByTestId("resume-tailor-workflow-mock").length,
    ).toBeGreaterThan(0);
  });

  it("opens the dedicated email history tab", () => {
    renderWithIntl(
      <ApplicationDetailView
        application={mockApplication}
        locale="en"
        defaultTab="details"
      />,
    );

    fireEvent.click(screen.getAllByRole("tab", { name: "Emails" })[0]);
    expect(screen.getAllByText("Sent emails").length).toBeGreaterThan(0);
  });
});
