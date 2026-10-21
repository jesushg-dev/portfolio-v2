import { render, screen } from "@testing-library/react";
import AuthLayout, { generateMetadata } from "./layout";
import { auth } from "@/lib/auth";
import { redirectToAdmin } from "@/lib/auth-redirect";

jest.mock("@/features/auth/components/auth-shell", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-shell">{children}</div>
  ),
}));

jest.mock("@/components/providers/trpc-provider", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="trpc-provider">{children}</div>
  ),
}));

describe("AuthLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects authenticated user to /admin", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue({
      user: { id: "user-123", email: "user@example.com" },
    });

    const params = Promise.resolve({ locale: "es" });
    await AuthLayout({
      children: <div>Child Content</div>,
      params,
    });

    expect(redirectToAdmin).toHaveBeenCalledWith("es");
  });

  it("renders children when user is not authenticated", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue(null);

    const params = Promise.resolve({ locale: "en" });
    const result = await AuthLayout({
      children: <div data-testid="test-child">Child Content</div>,
      params,
    });

    render(result);

    expect(redirectToAdmin).not.toHaveBeenCalled();
    expect(screen.getByTestId("test-child")).toBeInTheDocument();
    expect(screen.getByTestId("auth-shell")).toBeInTheDocument();
  });

  it("generates correct metadata title template", () => {
    const meta = generateMetadata();
    expect(meta.title).toEqual({
      template: "%s · Jehg",
      default: "Jehg",
    });
  });
});
