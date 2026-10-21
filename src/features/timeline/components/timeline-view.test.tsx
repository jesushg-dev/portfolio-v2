import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { TimelineView } from "./timeline-view";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import type { TimelinePublicItem } from "@/features/timeline/lib/map-timeline-public";

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

const mockItems: TimelinePublicItem[] = [
  {
    id: "item-1",
    title: "Senior Software Engineer",
    description: "Building critical features in React and Flutter.",
    organization: "Imagemaker",
    location: "Remote",
    category: "WORK",
    date: "Aug 2025 – Present",
    dateTime: "2025-08-01",
    startDate: "2025-08-01T00:00:00.000Z",
    endDate: null,
    current: true,
    images: ["https://example.com/img1.jpg"],
    technologies: ["React", "Flutter"],
    skills: [
      { id: "sk1", title: "React", image: "https://cdn.simpleicons.org/react" },
      {
        id: "sk2",
        title: "Flutter",
        image: "https://cdn.simpleicons.org/flutter",
      },
    ],
    roles: [],
    order: 0,
  },
  {
    id: "item-2",
    title: "Senior Software Engineer",
    description: "Contollo full-stack development.",
    organization: "Contollo",
    location: "Remote",
    category: "WORK",
    date: "Aug 2023 – Mar 2025",
    dateTime: "2023-08-01",
    startDate: "2023-08-01T00:00:00.000Z",
    endDate: "2025-03-01T00:00:00.000Z",
    current: false,
    images: [
      "https://example.com/contollo1.jpg",
      "https://example.com/contollo2.jpg",
    ],
    technologies: ["C#", "Nest.js", "Angular"],
    skills: [
      { id: "sk3", title: "C#", image: "https://cdn.simpleicons.org/csharp" },
      {
        id: "sk4",
        title: "Nest.js",
        image: "https://cdn.simpleicons.org/nestjs",
      },
      {
        id: "sk5",
        title: "Angular",
        image: "https://cdn.simpleicons.org/angular",
      },
    ],
    roles: [
      {
        title: "Development Team Lead",
        startDate: "2024-11",
        endDate: "2025-03",
      },
    ],
    order: 1,
  },
  {
    id: "item-3",
    title: "Web Developer Path",
    description: "Continuous training in modern web development.",
    organization: "Platzi",
    location: "Online",
    category: "COURSE",
    date: "2022",
    dateTime: "2022-01-01",
    startDate: "2022-01-01T00:00:00.000Z",
    endDate: null,
    current: false,
    images: [],
    technologies: ["HTML", "CSS", "JavaScript"],
    skills: [
      { id: "sk6", title: "HTML", image: "https://cdn.simpleicons.org/html5" },
      { id: "sk7", title: "CSS", image: "https://cdn.simpleicons.org/css3" },
      {
        id: "sk8",
        title: "JavaScript",
        image: "https://cdn.simpleicons.org/javascript",
      },
    ],
    roles: [],
    order: 2,
  },
];

describe("TimelineView", () => {
  it("renders the timeline title, items, and technologies", () => {
    renderWithIntl(<TimelineView items={mockItems} />);

    expect(screen.getAllByText("Imagemaker").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Contollo").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Platzi").length).toBeGreaterThanOrEqual(1);

    // Check technologies
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Flutter")).toBeInTheDocument();
    expect(screen.getByText("Nest.js")).toBeInTheDocument();

    // Check roles progression
    expect(screen.getByText("Development Team Lead")).toBeInTheDocument();
  });

  it("filters milestones when a category tab is selected", () => {
    renderWithIntl(<TimelineView items={mockItems} />);

    // Click on "Study & learning" or course tab
    const learningTab = screen.getByRole("tab", {
      name: /Study & learning|learning/i,
    });
    fireEvent.click(learningTab);

    // Course should be visible, while work items are excluded
    expect(screen.getAllByText("Platzi").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Imagemaker")).not.toBeInTheDocument();
  });

  it("displays link to the curriculum vitae", () => {
    renderWithIntl(<TimelineView items={mockItems} />);

    const cvLink = screen.getByRole("link", { name: /View full CV/i });
    expect(cvLink).toBeInTheDocument();
    expect(cvLink).toHaveAttribute("href", "/curriculum-vitae");
  });
});
