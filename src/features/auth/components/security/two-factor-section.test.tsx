import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test-utils/render-with-intl";

import TwoFactorSection from "./two-factor-section";

const mockEnable = jest.fn();
const mockDisable = jest.fn();
const mockVerifyTotp = jest.fn();
const mockGenerateBackupCodes = jest.fn();

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    twoFactor: {
      enable: (...args: unknown[]): unknown => mockEnable(...args),
      disable: (...args: unknown[]): unknown => mockDisable(...args),
      verifyTotp: (...args: unknown[]): unknown => mockVerifyTotp(...args),
      generateBackupCodes: (...args: unknown[]): unknown =>
        mockGenerateBackupCodes(...args),
    },
  },
}));

const BACKUP_CODES = ["aaaaa-11111", "bbbbb-22222", "ccccc-33333"];
const TOTP_URI =
  "otpauth://totp/Jehg:owner%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=Jehg";

describe("TwoFactorSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("walks through password → QR → code → backup codes when enabling", async () => {
    const user = userEvent.setup();
    const onChanged = jest.fn();
    mockEnable.mockResolvedValue({
      data: { method: "totp", totpURI: TOTP_URI, backupCodes: BACKUP_CODES },
      error: null,
    });
    mockVerifyTotp.mockResolvedValue({ data: { status: true }, error: null });

    renderWithIntl(
      <TwoFactorSection enabled={false} hasPassword onChanged={onChanged} />,
    );

    expect(screen.getByText("Off")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Enable 2FA" }));

    await user.type(
      screen.getByLabelText("Confirm your password"),
      "correct horse battery",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(mockEnable).toHaveBeenCalledWith({
        password: "correct horse battery",
      });
    });

    expect(
      screen.getByRole("img", { name: "QR code for your authenticator app" }),
    ).toBeInTheDocument();
    expect(screen.getByText("JBSWY3DPEHPK3PXP")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Code from the app"), "123 456");
    await user.click(screen.getByRole("button", { name: "Verify and enable" }));

    await waitFor(() => {
      expect(mockVerifyTotp).toHaveBeenCalledWith({ code: "123456" });
    });

    for (const backupCode of BACKUP_CODES) {
      expect(screen.getByText(backupCode)).toBeInTheDocument();
    }
    expect(onChanged).toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "I've saved my backup codes" }),
    );
    expect(
      screen.getByText(
        "Two-factor authentication is on. You'll be asked for a code on your next sign-in.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the server error when the code does not match", async () => {
    const user = userEvent.setup();
    mockEnable.mockResolvedValue({
      data: { method: "totp", totpURI: TOTP_URI, backupCodes: BACKUP_CODES },
      error: null,
    });
    mockVerifyTotp.mockResolvedValue({
      data: null,
      error: { status: 401, message: "Invalid code" },
    });

    renderWithIntl(<TwoFactorSection enabled={false} hasPassword />);

    await user.click(screen.getByRole("button", { name: "Enable 2FA" }));
    await user.type(screen.getByLabelText("Confirm your password"), "secret12");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(
      await screen.findByLabelText("Code from the app"),
      "000000",
    );
    await user.click(screen.getByRole("button", { name: "Verify and enable" }));

    expect(await screen.findByText("Invalid code")).toBeInTheDocument();
    expect(screen.queryByText(BACKUP_CODES[0])).not.toBeInTheDocument();
  });

  it("disables 2FA after confirming the password", async () => {
    const user = userEvent.setup();
    const onChanged = jest.fn();
    mockDisable.mockResolvedValue({ data: { status: true }, error: null });

    renderWithIntl(
      <TwoFactorSection enabled hasPassword onChanged={onChanged} />,
    );

    expect(screen.getByText("On")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Disable 2FA" }));
    await user.type(screen.getByLabelText("Confirm your password"), "secret12");
    await user.click(screen.getByRole("button", { name: "Disable" }));

    await waitFor(() => {
      expect(mockDisable).toHaveBeenCalledWith({ password: "secret12" });
    });
    expect(
      screen.getByText("Two-factor authentication is off."),
    ).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalled();
  });

  it("regenerates backup codes", async () => {
    const user = userEvent.setup();
    mockGenerateBackupCodes.mockResolvedValue({
      data: { status: true, backupCodes: BACKUP_CODES },
      error: null,
    });

    renderWithIntl(<TwoFactorSection enabled hasPassword />);

    await user.click(screen.getByRole("button", { name: "New backup codes" }));
    await user.type(screen.getByLabelText("Confirm your password"), "secret12");
    await user.click(screen.getByRole("button", { name: "Generate codes" }));

    expect(await screen.findByText(BACKUP_CODES[1])).toBeInTheDocument();
    expect(mockGenerateBackupCodes).toHaveBeenCalledWith({
      password: "secret12",
    });
  });

  it("blocks social-only accounts until a password exists", () => {
    renderWithIntl(<TwoFactorSection enabled={false} hasPassword={false} />);

    expect(screen.getByRole("button", { name: "Enable 2FA" })).toBeDisabled();
    expect(
      screen.getByText(
        "Set a password for this account before enabling two-factor authentication.",
      ),
    ).toBeInTheDocument();
    expect(mockEnable).not.toHaveBeenCalled();
  });
});
