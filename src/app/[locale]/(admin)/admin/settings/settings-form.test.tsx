import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test-utils/render-with-intl";

import SettingsForm from "./settings-form";

const mockUpsertProfile = jest.fn();
const mockInvalidate = jest.fn();

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      cv: {
        getMine: { invalidate: mockInvalidate },
      },
    }),
    cv: {
      upsertProfile: {
        useMutation: () => ({ mutateAsync: mockUpsertProfile }),
      },
    },
  },
}));

describe("SettingsForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    defaultValues: {
      username: "testuser",
      displayName: "Test User",
      logoInitials: "TU",
      logoImageUrl: "",
      defaultLocale: "en" as const,
      isPublished: true,
    },
  };

  it("renders form fields with default values", () => {
    renderWithIntl(<SettingsForm {...defaultProps} />);

    expect(screen.getByLabelText("Username (subdomain)")).toHaveValue(
      "testuser",
    );
    expect(screen.getByLabelText("Display name")).toHaveValue("Test User");
    expect(screen.getByLabelText("Initials / text logo")).toHaveValue("TU");
    expect(
      screen.queryByLabelText("CV PDF URL (optional)"),
    ).not.toBeInTheDocument();
  });

  it("handles successful submission", async () => {
    const user = userEvent.setup();
    mockUpsertProfile.mockResolvedValue({ success: true });

    renderWithIntl(<SettingsForm {...defaultProps} />);

    const submitBtn = screen.getByRole("button", { name: "Save settings" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockUpsertProfile).toHaveBeenCalledWith({
        username: "testuser",
        displayName: "Test User",
        logoInitials: "TU",
        logoImageUrl: "",
        defaultLocale: "en",
        isPublished: true,
        mapLocationLabel: "",
      });
      const firstCallArgs = mockUpsertProfile.mock.calls[0] as
        | [Record<string, unknown>]
        | undefined;
      expect(firstCallArgs?.[0]).not.toHaveProperty("cvPdfUrl");
      expect(mockInvalidate).toHaveBeenCalled();
      expect(screen.getByText("Settings saved.")).toBeInTheDocument();
    });
  });

  it("handles submission error", async () => {
    const user = userEvent.setup();
    mockUpsertProfile.mockRejectedValue(new Error("Database error"));

    renderWithIntl(<SettingsForm {...defaultProps} />);

    const submitBtn = screen.getByRole("button", { name: "Save settings" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Database error")).toBeInTheDocument();
    });
  });
});
