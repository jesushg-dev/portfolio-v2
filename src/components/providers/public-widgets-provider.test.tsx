import { fireEvent, render, screen } from "@testing-library/react";

import PublicWidgetsProvider, {
  usePublicWidgetsReady,
} from "./public-widgets-provider";

const mockUsePathname = jest.fn(() => "/");

jest.mock("@/i18n/routing", () => ({
  usePathname: () => mockUsePathname(),
}));

function ReadyProbe() {
  const isReady = usePublicWidgetsReady();
  return <span data-testid="widgets-ready">{String(isReady)}</span>;
}

describe("PublicWidgetsProvider", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
      writable: true,
    });
  });

  it("enables widgets immediately on non-home routes", () => {
    mockUsePathname.mockReturnValue("/schedule");

    render(
      <PublicWidgetsProvider>
        <ReadyProbe />
      </PublicWidgetsProvider>,
    );

    expect(screen.getByTestId("widgets-ready")).toHaveTextContent("true");
  });

  it("defers optional home widgets without hiding page content", () => {
    render(
      <PublicWidgetsProvider>
        <ReadyProbe />
      </PublicWidgetsProvider>,
    );

    expect(screen.getByTestId("widgets-ready")).toHaveTextContent("false");
  });

  it("enables widgets on reload when scroll position is restored", () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 640,
      writable: true,
    });

    render(
      <PublicWidgetsProvider>
        <ReadyProbe />
      </PublicWidgetsProvider>,
    );

    expect(screen.getByTestId("widgets-ready")).toHaveTextContent("true");
  });

  it("preserves the page when interaction enables live widgets", () => {
    render(
      <PublicWidgetsProvider>
        <h1>Portfolio</h1>
        <ReadyProbe />
      </PublicWidgetsProvider>,
    );
    const heading = screen.getByRole("heading", { name: "Portfolio" });

    fireEvent.scroll(window);

    expect(screen.getByTestId("widgets-ready")).toHaveTextContent("true");
    expect(screen.getByRole("heading", { name: "Portfolio" })).toBe(heading);
  });
});
