import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { NowContribGraph } from "./now-contrib-graph";
import type { ReadyGitHubContributions } from "../lib/github-contributions";

const mockCalendar: ReadyGitHubContributions = {
  status: "ready",
  username: "jesush",
  total: 512,
  weeks: [
    [
      { date: "2024-01-01", count: 3, level: 2, weekday: 0 },
      { date: "2024-01-02", count: 0, level: 0, weekday: 1 },
    ],
  ],
  stats: {
    activity: {
      commits: 340,
      issues: 12,
      pullRequests: 45,
      reviews: 18,
      repositories: 7,
    },
    languages: [{ name: "TypeScript", bytes: 50000 }],
    sampledRepositories: 7,
    totalRepositories: 7,
    stars: 35,
    forks: 8,
  },
};

describe("NowContribGraph", () => {
  it("renders metric headers and contribution tabs starting with flat view", () => {
    renderWithIntl(<NowContribGraph calendar={mockCalendar} />);

    // Metric headers
    expect(screen.getByText("512")).toBeInTheDocument();
    expect(screen.getByText("340")).toBeInTheDocument();

    // Tabs
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true"); // Flat / Plano
    expect(tabs[1]).toHaveAttribute("aria-selected", "false"); // 3D
    expect(tabs[2]).toHaveAttribute("aria-selected", "false"); // Breakout
  });

  it("switches to 3D tab when user clicks the 3D tab", async () => {
    const user = userEvent.setup();
    renderWithIntl(<NowContribGraph calendar={mockCalendar} />);

    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[1]);

    await waitFor(() => {
      expect(tabs[0]).toHaveAttribute("aria-selected", "false");
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    });
  });

  it("switches back to Flat tab when user clicks the Flat tab", async () => {
    const user = userEvent.setup();
    renderWithIntl(<NowContribGraph calendar={mockCalendar} />);

    const tabs = screen.getAllByRole("tab");
    // Switch to 3D
    await user.click(tabs[1]);
    await waitFor(() => {
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    });

    // Switch back to Flat
    await user.click(tabs[0]);
    await waitFor(() => {
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
      expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    });
  });
});
