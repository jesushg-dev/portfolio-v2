import { render, screen } from "@testing-library/react";

import DeferredTrpcProvider, {
  useTrpcDeferredReady,
} from "./deferred-trpc-provider";

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
  const isReady = useTrpcDeferredReady();
  return <span data-testid="trpc-ready">{String(isReady)}</span>;
}

describe("DeferredTrpcProvider", () => {
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
      <DeferredTrpcProvider>
        <ReadyProbe />
      </DeferredTrpcProvider>,
    );

    expect(screen.getByTestId("trpc-provider")).toBeInTheDocument();
    expect(screen.getByTestId("trpc-ready")).toHaveTextContent("true");
  });

  it("defers tRPC on the home landing when at the top", () => {
    render(
      <DeferredTrpcProvider>
        <ReadyProbe />
      </DeferredTrpcProvider>,
    );

    expect(screen.queryByTestId("trpc-provider")).not.toBeInTheDocument();
    expect(screen.getByTestId("trpc-ready")).toHaveTextContent("false");
  });

  it("enables tRPC on reload when scroll position is restored", () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 640,
      writable: true,
    });

    render(
      <DeferredTrpcProvider>
        <ReadyProbe />
      </DeferredTrpcProvider>,
    );

    expect(screen.getByTestId("trpc-provider")).toBeInTheDocument();
    expect(screen.getByTestId("trpc-ready")).toHaveTextContent("true");
  });
});
