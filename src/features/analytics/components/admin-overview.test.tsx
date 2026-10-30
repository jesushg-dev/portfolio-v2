import { screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { AdminOverview } from "./admin-overview";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import type { AdminOverviewData } from "@/features/analytics/lib/admin-overview-types";

const mockToggleMutateAsync = jest
  .fn()
  .mockResolvedValue({ id: "s-1", isActive: false });

jest.mock("@/trpc/react", () => ({
  api: {
    servicesAdmin: {
      toggleActive: {
        useMutation: () => ({
          mutateAsync: mockToggleMutateAsync,
          isPending: false,
        }),
      },
    },
  },
}));

const mockData: AdminOverviewData = {
  hasProfile: true,
  traffic: {
    pageviews: 247,
    visits: 142,
    countryCount: 10,
    topPath: "/",
    countries: [
      { key: "NI", pageviews: 52 },
      { key: "US", pageviews: 26 },
      { key: "Unknown", pageviews: 137 },
    ],
    paths: [
      { key: "/", pageviews: 136 },
      { key: "/curriculum-vitae", pageviews: 20 },
    ],
    referrers: [
      { key: "google.com", pageviews: 4 },
      { key: "instagram.com", pageviews: 7 },
    ],
  },
  jobs: {
    totalApplications: 36,
    totalCompanies: 34,
    applied: 16,
    inProgress: 0,
    offers: 0,
    ghosted: 13,
    rejected: 7,
    hired: 0,
  },
  upcomingEvents: [],
  services: [
    {
      id: "s-1",
      title: "Backend & Distributed Systems",
      type: "BACKEND",
      isActive: true,
      featured: false,
    },
    {
      id: "s-2",
      title: "System Architecture",
      type: "ARCHITECTURE",
      isActive: true,
      featured: true,
    },
  ],
  inventory: {
    certifications: 50,
    projects: 25,
    skills: 73,
  },
};

describe("AdminOverview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders visitor metrics and breakdown lists", () => {
    renderWithIntl(<AdminOverview data={mockData} />);

    expect(screen.getByText("247")).toBeInTheDocument();
    expect(screen.getByText("142")).toBeInTheDocument();
    expect(
      screen.getByText("Backend & Distributed Systems"),
    ).toBeInTheDocument();
    expect(screen.getByText("System Architecture")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("73")).toBeInTheDocument();
  });

  it("renders job tracker pipeline stats and status distribution", () => {
    renderWithIntl(<AdminOverview data={mockData} />);

    expect(screen.getAllByText("16").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("13")).toBeInTheDocument();
    expect(screen.getAllByText("7").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("No upcoming events")).toBeInTheDocument();
  });

  it("toggles service visibility when switch is clicked", async () => {
    renderWithIntl(<AdminOverview data={mockData} />);

    const switches = screen.getAllByRole("switch");
    expect(switches.length).toBe(2);

    act(() => {
      fireEvent.click(switches[0]);
    });
    expect(mockToggleMutateAsync).toHaveBeenCalledWith({
      id: "s-1",
      isActive: false,
    });
  });
});
