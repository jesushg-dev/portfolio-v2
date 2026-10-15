import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { ApplicationEmailHistory } from "./application-email-history";

const mockRefetch = jest.fn();

jest.mock("@/trpc/react", () => ({
  api: {
    jobTrackerAdmin: {
      getApplicationEmailHistory: {
        useQuery: () => ({
          data: [
            {
              id: "email-1",
              recipientEmail: "jobs@example.com",
              subject: "Frontend Engineer application",
              attachmentName: "resume.pdf",
              trackingEnabled: true,
              openCount: 4,
              firstOpenedAt: new Date("2026-10-01T13:00:00.000Z"),
              lastOpenedAt: new Date("2026-10-01T15:00:00.000Z"),
              sentAt: new Date("2026-10-01T12:00:00.000Z"),
            },
          ],
          isLoading: false,
          isFetching: false,
          isError: false,
          refetch: mockRefetch,
        }),
      },
    },
  },
}));

describe("ApplicationEmailHistory", () => {
  it("shows per-send approximate counts and allows refreshing", () => {
    renderWithIntl(
      <ApplicationEmailHistory applicationId="app-1" locale="en" />,
    );

    expect(screen.getByText("Sent emails")).toBeInTheDocument();
    expect(
      screen.getByText("Frontend Engineer application"),
    ).toBeInTheDocument();
    expect(screen.getByText(/First detected load/)).toBeInTheDocument();
    expect(screen.getByText(/Total image loads/)).toHaveTextContent("4");
    expect(
      screen.getByText(/Email clients may block or cache images/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(mockRefetch).toHaveBeenCalled();
  });
});
