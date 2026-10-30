import { fireEvent, render, screen } from "@testing-library/react";

import PublicTrpcProvider, {
  usePublicWidgetsReady,
} from "./public-trpc-provider";

const mockUsePathname = jest.fn(() => "/");

jest.mock("@/i18n/routing", () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock("@/trpc/react", () => ({
  TRPCReactProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="trpc-provider">{children}</div>
  ),
}));

function ReadyProbe() {
  const isReady = usePublicWidgetsReady();
  return <span data-testid="trpc-ready">{String(isReady)}</span>;
}

describe("PublicTrpcProvider", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
      writable: true,
    });
  });

  it("mounts tRPC immediately on non-home routes", () => {
    mockUsePathname.mockReturnValue("/schedule");

    render(
      <PublicTrpcProvider>
        <ReadyProbe />
      </PublicTrpcProvider>,
    );

    expect(screen.getByTestId("trpc-provider")).toBeInTheDocument();
    expect(screen.getByTestId("trpc-ready")).toHaveTextContent("true");
  });

  it("keeps tRPC mounted while deferring optional home widgets", () => {
    render(
      <PublicTrpcProvider>
        <ReadyProbe />
      </PublicTrpcProvider>,
    );

    expect(screen.getByTestId("trpc-provider")).toBeInTheDocument();
    expect(screen.getByTestId("trpc-ready")).toHaveTextContent("false");
  });

  it("enables tRPC on reload when scroll position is restored", () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 640,
      writable: true,
    });

    render(
      <PublicTrpcProvider>
        <ReadyProbe />
      </PublicTrpcProvider>,
    );

    expect(screen.getByTestId("trpc-provider")).toBeInTheDocument();
    expect(screen.getByTestId("trpc-ready")).toHaveTextContent("true");
  });

  it("preserves the page when interaction enables live widgets", () => {
    render(
      <PublicTrpcProvider>
        <h1>Portfolio</h1>
        <ReadyProbe />
      </PublicTrpcProvider>,
    );
    const heading = screen.getByRole("heading", { name: "Portfolio" });

    fireEvent.scroll(window);

    expect(screen.getByTestId("trpc-ready")).toHaveTextContent("true");
    expect(screen.getByRole("heading", { name: "Portfolio" })).toBe(heading);
  });
});
