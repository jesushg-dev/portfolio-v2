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
  },
}));

describe("ApplicationEmailDialog", () => {
  it("keeps email tracking opt-in and explains the measurement", () => {
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
    const trackCheckbox = screen.getByRole("checkbox", {
      name: "Measure email loads",
    });

    expect(copyCheckbox).toHaveAttribute("aria-checked", "true");
    expect(trackCheckbox).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Measure email loads")).toBeInTheDocument();
    expect(
      screen.getByText(/Loads are approximate and do not confirm/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Sends an identical copy to your inbox without a tracking pixel/,
      ),
    ).toBeInTheDocument();
  });
});
