import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test-utils/render-with-intl";

import TwoFactorVerifyForm from "./two-factor-verify-form";

const mockVerifyTotp = jest.fn();
const mockVerifyOtp = jest.fn();
const mockVerifyBackupCode = jest.fn();
const mockSendOtp = jest.fn();
let searchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    twoFactor: {
      verifyTotp: (...args: unknown[]): unknown => mockVerifyTotp(...args),
      verifyOtp: (...args: unknown[]): unknown => mockVerifyOtp(...args),
      verifyBackupCode: (...args: unknown[]): unknown =>
        mockVerifyBackupCode(...args),
      sendOtp: (...args: unknown[]): unknown => mockSendOtp(...args),
    },
  },
}));

jest.mock("@/features/auth/components/auth-showcase-panel", () => ({
  __esModule: true,
  default: () => null,
}));

const assign = jest.fn();
jest.mock("@/lib/hard-navigate", () => ({
  hardNavigate: (url: string): void => {
    assign(url);
  },
}));

describe("TwoFactorVerifyForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchParams = new URLSearchParams();
  });

  it("verifies an authenticator code without trusting the device", async () => {
    const user = userEvent.setup();
    mockVerifyTotp.mockResolvedValue({ data: { token: "t" }, error: null });
    searchParams = new URLSearchParams({ next: "/admin/settings" });

    renderWithIntl(<TwoFactorVerifyForm />);

    await user.type(screen.getByLabelText("Verification code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() => {
      expect(mockVerifyTotp).toHaveBeenCalledWith({
        code: "123456",
        trustDevice: false,
      });
    });
    expect(assign).toHaveBeenCalledWith("http://localhost/admin/settings");
  });

  it("only offers the methods the server reported (plus backup codes)", () => {
    searchParams = new URLSearchParams({ methods: "otp" });

    renderWithIntl(<TwoFactorVerifyForm />);

    expect(screen.getByRole("tab", { name: "Email code" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Backup code" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Authenticator" }),
    ).not.toBeInTheDocument();
  });

  it("sends an email code before the input becomes usable", async () => {
    const user = userEvent.setup();
    mockSendOtp.mockResolvedValue({ data: { status: true }, error: null });
    mockVerifyOtp.mockResolvedValue({ data: { token: "t" }, error: null });
    searchParams = new URLSearchParams({ methods: "otp" });

    renderWithIntl(<TwoFactorVerifyForm />);

    expect(screen.getByLabelText("Verification code")).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Email me a code" }));

    await waitFor(() => expect(mockSendOtp).toHaveBeenCalled());
    expect(
      screen.getByText(
        "Code sent. Check your inbox — it expires in 5 minutes.",
      ),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Verification code"), "654321");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        code: "654321",
        trustDevice: false,
      });
    });
  });

  it("verifies a backup code and shows server errors", async () => {
    const user = userEvent.setup();
    mockVerifyBackupCode.mockResolvedValue({
      data: null,
      error: { status: 401, message: "Invalid backup code" },
    });

    renderWithIntl(<TwoFactorVerifyForm />);

    await user.click(screen.getByRole("tab", { name: "Backup code" }));
    await user.type(screen.getByLabelText("Backup code"), "aaaaa-11111");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    expect(await screen.findByText("Invalid backup code")).toBeInTheDocument();
    expect(mockVerifyBackupCode).toHaveBeenCalledWith({
      code: "aaaaa-11111",
      trustDevice: false,
    });
    expect(assign).not.toHaveBeenCalled();
  });
});
