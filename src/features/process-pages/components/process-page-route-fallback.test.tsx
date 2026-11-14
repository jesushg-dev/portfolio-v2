import { render, screen } from "@testing-library/react";
import {
  ProcessPageRouteFallback,
  ProcessPageSkeleton,
} from "./process-page-route-fallback";

describe("ProcessPageRouteFallback / ProcessPageSkeleton", () => {
  it("renders with accessible status role and aria attributes", () => {
    render(<ProcessPageSkeleton />);

    const container = screen.getByRole("status");
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute("aria-busy", "true");
    expect(container).toHaveAttribute("aria-label", "Loading process page");
    expect(screen.getByText("Loading process page...")).toBeInTheDocument();
  });

  it("renders multiple pulse skeleton placeholders for hero, nav, grid, and timeline", () => {
    const { container } = render(<ProcessPageRouteFallback />);

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    // Ensure rich layout with dozens of skeleton placeholders
    expect(skeletons.length).toBeGreaterThan(15);
  });

  it("renders the sticky navigation skeleton", () => {
    const { container } = render(<ProcessPageSkeleton />);

    const nav = container.querySelector("nav[aria-hidden='true']");
    expect(nav).toBeInTheDocument();
  });

  it("renders the terminal/visual box placeholder in hero", () => {
    const { container } = render(<ProcessPageSkeleton />);

    const terminalBox = container.querySelector(".backdrop-blur-xs");
    expect(terminalBox).toBeInTheDocument();
  });
});
