import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";
import { TimelineHorizontalPreview } from "./timeline-horizontal-preview";
import type { TimelinePublicItem } from "@/features/timeline/lib/map-timeline-public";

const mockItems: TimelinePublicItem[] = [
  {
    id: "tl-1",
    title: "Senior Software Engineer",
    organization: "Walmart",
    location: "Remote",
    description: "Architected microservices and reduced MTTR by 40%.",
    category: "WORK",
    date: "2024 - Present",
    dateTime: "2024-01-01",
    startDate: "2024-01-01",
    endDate: null,
    current: true,
    images: [],
    order: 1,
  },
  {
    id: "tl-2",
    title: "Full Stack Developer",
    organization: "Contollo",
    location: "Remote",
    description: "Built scalable web apps and CI/CD pipelines.",
    category: "WORK",
    date: "2023 - 2024",
    dateTime: "2023-01-01",
    startDate: "2023-01-01",
    endDate: "2024-01-01",
    current: false,
    images: [],
    order: 2,
  },
];

describe("TimelineHorizontalPreview", () => {
  it("renders empty message when items array is empty", () => {
    renderWithIntl(<TimelineHorizontalPreview items={[]} />);
    expect(screen.getByText("No timeline entries yet.")).toBeInTheDocument();
  });

  it("renders timeline nodes with dates, titles, and organizations", () => {
    renderWithIntl(<TimelineHorizontalPreview items={mockItems} />);

    expect(screen.getByText("2024 - Present")).toBeInTheDocument();
    expect(screen.getByText(/Senior Software Engineer/)).toBeInTheDocument();
    expect(screen.getByText(/Walmart/)).toBeInTheDocument();
    expect(
      screen.getByText("Architected microservices and reduced MTTR by 40%."),
    ).toBeInTheDocument();

    expect(screen.getByText("2023 - 2024")).toBeInTheDocument();
    expect(screen.getByText(/Full Stack Developer/)).toBeInTheDocument();
    expect(screen.getByText(/Contollo/)).toBeInTheDocument();
    expect(
      screen.getByText("Built scalable web apps and CI/CD pipelines."),
    ).toBeInTheDocument();

    expect(screen.getByText("View full timeline")).toBeInTheDocument();
  });
});
