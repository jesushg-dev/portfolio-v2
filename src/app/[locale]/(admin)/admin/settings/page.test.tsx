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
      user: { id: "user-1", name: "John Doe" },
    });

    (db.profile.findUnique as jest.Mock).mockResolvedValue({
      username: "johndoe",
      displayName: "John D",
      defaultLocale: "en",
      isPublished: true,
      cvPdfUrl: "https://example.com/cv.pdf",
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
    expect(screen.getByTestId("pdf-links-form")).toBeInTheDocument();
  });
});
