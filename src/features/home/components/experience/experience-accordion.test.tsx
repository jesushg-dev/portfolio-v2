import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";
import {
  ExperienceAccordion,
  type ExperienceItem,
} from "./experience-accordion";

jest.mock("@/components/app-layout/public-cv-visible", () => ({
  usePublicCvVisible: () => true,
}));

const mockExperiences: ExperienceItem[] = [
  {
    id: "exp-1",
    company: "Walmart",
    companyLogoUrl: "https://example.com/walmart.png",
    current: true,
    role: "Senior Software Engineer",
    dates: "2024 - Present",
    responsibilities: [
      "Led legacy monolith migration to resilient microservices.",
      "Reduced critical incident MTTR by 40%.",
    ],
  },
  {
    id: "exp-2",
    company: "Contollo",
    companyLogoUrl: null,
    current: false,
    role: "Development Team Lead",
    dates: "November 2024 – March 2025",
    responsibilities: ["Mentored junior engineers and conducted code reviews."],
  },
  {
    id: "exp-3",
    company: "Contollo",
    companyLogoUrl: null,
    current: false,
    role: "Senior Software Engineer",
    dates: "August 2023 – November 2024",
    responsibilities: ["Built enterprise APIs and microservices."],
  },
];

describe("ExperienceAccordion", () => {
  it("renders all experience roles and companies", () => {
    renderWithIntl(
      <ExperienceAccordion
        experiences={mockExperiences}
        viewAllLabel="View full CV"
      />,
    );

    expect(
      screen.getAllByText("Senior Software Engineer")[0],
    ).toBeInTheDocument();
    expect(screen.getByText("· Walmart")).toBeInTheDocument();
    expect(screen.getAllByText("2024 - Present")[0]).toBeInTheDocument();

    expect(screen.getByText("Development Team Lead")).toBeInTheDocument();
    expect(screen.getAllByText("· Contollo")[0]).toBeInTheDocument();
  });

  it("groups consecutive roles at the same company under a single promotion card", () => {
    renderWithIntl(
      <ExperienceAccordion
        experiences={mockExperiences}
        viewAllLabel="View full CV"
      />,
    );

    // Shows the promoted role as main card title with · Contollo and promotion badge
    expect(screen.getByText("Development Team Lead")).toBeInTheDocument();
    expect(screen.getByText("· Contollo")).toBeInTheDocument();
    expect(screen.getByText("Promotion")).toBeInTheDocument();
  });

  it("expands the first item by default and shows responsibilities", () => {
    renderWithIntl(
      <ExperienceAccordion
        experiences={mockExperiences}
        viewAllLabel="View full CV"
      />,
    );

    expect(
      screen.getByText("Reduced critical incident MTTR by 40%."),
    ).toBeInTheDocument();
  });

  it("shows previous roles when expanding a multi-role company card", () => {
    renderWithIntl(
      <ExperienceAccordion
        experiences={mockExperiences}
        viewAllLabel="View full CV"
      />,
    );

    const contolloCard = screen.getByRole("button", {
      name: /Development Team Lead/i,
    });
    fireEvent.click(contolloCard);

    expect(screen.getByText("Previous position")).toBeInTheDocument();
    expect(
      screen.getByText("Senior Software Engineer", { selector: "h4" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Built enterprise APIs and microservices."),
    ).toBeInTheDocument();
  });

  it("renders view all CV link when visible", () => {
    renderWithIntl(
      <ExperienceAccordion
        experiences={mockExperiences}
        viewAllLabel="View full CV"
      />,
    );

    const cvLink = screen.getByRole("link", { name: /View full CV/i });
    expect(cvLink).toHaveAttribute("href", "/curriculum-vitae");
  });
});
