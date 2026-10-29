import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { ApplicationEmailDialog } from "./application-email-panel";

jest.mock("@/i18n/routing", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      jobTrackerAdmin: {
        getApplicationById: { invalidate: jest.fn() },
        getApplications: { invalidate: jest.fn() },
        getApplicationEmailHistory: { invalidate: jest.fn() },
      },
    }),
    jobTrackerAdmin: {
      getApplicationEmailHistory: {
        useQuery: () => ({ data: [] }),
      },
      getApplicationEmailCapabilities: {
        useQuery: () => ({
          data: { canSendEmail: true, hasAiProvider: true },
        }),
      },
      draftApplicationEmail: {
        useMutation: () => ({ mutate: jest.fn(), isPending: false }),
      },
      sendApplicationEmail: {
        useMutation: () => ({ mutate: jest.fn(), isPending: false }),
      },
    },
    integrationsAdmin: {
      uploadFile: {
        useMutation: () => ({ mutateAsync: jest.fn(), isPending: false }),
      },
    },
    resumeEngineAdmin: {
      generateTailoredPdf: {
        useMutation: () => ({ mutateAsync: jest.fn(), isPending: false }),
      },
    },
  },
}));

describe("ApplicationEmailDialog", () => {
  it("keeps send copy opt-in and explains email tracking", () => {
    renderWithIntl(
      <ApplicationEmailDialog
        open
        onOpenChange={jest.fn()}
        applicationId="app-1"
        hasCvFile
        cvFileName="resume.pdf"
        locale="en"
      />,
    );

    const copyCheckbox = screen.getByRole("checkbox", {
      name: "Send a copy to my email",
    });

    expect(copyCheckbox).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByText(/Sends a copy to your inbox for your records/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Resend manages open tracking at domain level/),
    ).toBeInTheDocument();
  });
});
