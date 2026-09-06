import { render, screen } from "@testing-library/react";

import SettingsPage from "./page";
import { auth } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import { db } from "@/server/db";

jest.mock("@/server/db", () => ({
  db: {
    profile: {
      findUnique: jest.fn(),
    },
    cvPdfLink: {
      findMany: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
    },
  },
}));

const mockSecurityCard = jest.fn();
jest.mock("@/features/auth/components/security/security-settings-card", () => ({
  __esModule: true,
  default: (props: { twoFactorEnabled: boolean; hasPassword: boolean }) => {
    mockSecurityCard(props);
    return <div data-testid="security-settings-card" />;
  },
}));

jest.mock("./settings-form", () => ({
  __esModule: true,
  default: () => <div data-testid="settings-form" />,
}));

jest.mock("./pdf-links-form", () => ({
  __esModule: true,
  default: () => <div data-testid="pdf-links-form" />,
}));

jest.mock("./settings-integrations-card", () => ({
  SettingsIntegrationsCard: () => (
    <div data-testid="settings-integrations-card" />
  ),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to login if user is not authenticated", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue(null);

    const params = Promise.resolve({ locale: "en" });
    await SettingsPage({ params });

    expect(redirectToLogin).toHaveBeenCalledWith("en");
  });

  it("renders page and forms with user data", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue({
      user: { id: "user-1", name: "John Doe", twoFactorEnabled: true },
    });
    (db.account.findFirst as jest.Mock).mockResolvedValue({ id: "acc-1" });

    (db.profile.findUnique as jest.Mock).mockResolvedValue({
      username: "johndoe",
      displayName: "John D",
      defaultLocale: "en",
      isPublished: true,
    });

    (db.cvPdfLink.findMany as jest.Mock).mockResolvedValue([
      { locale: "en", url: "url-en" },
    ]);

    const params = Promise.resolve({ locale: "en" });
    const Page = await SettingsPage({ params });
    render(Page as React.ReactElement);

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();
    expect(screen.getByTestId("settings-form")).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-integrations-card"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("pdf-links-form")).toBeInTheDocument();
    expect(screen.getByTestId("security-settings-card")).toBeInTheDocument();
    expect(mockSecurityCard).toHaveBeenCalledWith({
      twoFactorEnabled: true,
      hasPassword: true,
    });
  });

  it("tells the security card when the account has no password", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue({
      user: { id: "user-1", name: "John Doe" },
    });
    (db.profile.findUnique as jest.Mock).mockResolvedValue(null);
    (db.cvPdfLink.findMany as jest.Mock).mockResolvedValue([]);
    (db.account.findFirst as jest.Mock).mockResolvedValue(null);

    const Page = await SettingsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(Page as React.ReactElement);

    expect(mockSecurityCard).toHaveBeenCalledWith({
      twoFactorEnabled: false,
      hasPassword: false,
    });
  });
});
