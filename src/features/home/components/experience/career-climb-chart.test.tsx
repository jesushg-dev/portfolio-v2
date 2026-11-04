import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { CareerClimbChart } from "./career-climb-chart";
import {
  getCareerMilestones,
  getCareerMonths,
  type CareerExperience,
} from "./career-timeline";

jest.mock("@/components/app-layout/public-cv-visible", () => ({
  usePublicCvVisible: () => true,
}));

const experiences: CareerExperience[] = [
  {
    id: "new",
    company: "Tenant company",
    role: "Engineer",
    dates: "2025 – Present",
    startDate: new Date("2025-01-01"),
    current: true,
    responsibilities: ["Build tenant products"],
    skills: ["TypeScript"],
  },
  {
    id: "old",
    company: "Earlier company",
    role: "Developer",
    dates: "2022 – 2024",
    startDate: new Date("2022-01-01"),
    current: false,
    responsibilities: ["Maintain tenant applications"],
  },
];

describe("CareerClimbChart", () => {
  it("merges concurrent jobs and excludes gaps and unknown end dates from month totals", () => {
    const reference = new Date("2026-01-01");
    const known = {
      ...experiences[0],
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-07-01"),
      current: false,
    };
    expect(
      getCareerMonths(
        [
          known,
          { ...known, id: "overlap", startDate: new Date("2025-03-01") },
          { ...known, id: "unknown", endDate: null },
        ],
        reference,
      ),
    ).toBe(6);
    expect(
      getCareerMonths(
        [
          { ...known, current: true },
          { ...known, id: "overlap", current: true },
        ],
        reference,
      ),
    ).toBe(12);
    expect(
      getCareerMonths(
        [{ ...known, startDate: new Date("2027-01-01"), current: true }],
        reference,
      ),
    ).toBe(0);
  });

  it("orders real milestones chronologically without inventing missing dates", () => {
    const milestones = getCareerMilestones([
      ...experiences,
      { ...experiences[0], id: "undated", startDate: null },
    ]);
    expect(milestones.map((point) => point.experience.id)).toEqual([
      "old",
      "new",
    ]);
    expect(
      milestones.every(
        (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
      ),
    ).toBe(true);
  });

  it("shows the latest role and offers unclipped select, previous/next, and graph navigation", () => {
    renderWithIntl(
      <CareerClimbChart
        experiences={experiences}
        viewAllLabel="View CV"
        referenceDate={new Date("2026-01-01")}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Engineer" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Build tenant products")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(
      screen.getByRole("heading", { name: "Developer" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Build tenant products")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      screen.getByRole("heading", { name: "Engineer" }),
    ).toBeInTheDocument();
    const oldPoint = screen.getByRole("button", {
      name: "Earlier company · Developer · 2022 – 2024",
    });
    fireEvent.click(oldPoint);
    expect(
      screen.getByRole("heading", { name: "Developer" }),
    ).toBeInTheDocument();
    fireEvent.keyDown(oldPoint, { key: "ArrowRight" });
    expect(
      screen.getByRole("heading", { name: "Engineer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Tenant company · Engineer · 2025 – Present",
      }),
    ).toHaveFocus();
    expect(screen.getByRole("link", { name: "View CV" })).toHaveAttribute(
      "href",
      "/curriculum-vitae",
    );
  });

  it("shows a configurable next-stage invitation only when supplied by explicit availability", () => {
    const props = {
      experiences,
      viewAllLabel: "View CV",
      referenceDate: new Date("2026-01-01"),
    };
    const { rerender } = renderWithIntl(<CareerClimbChart {...props} />);
    expect(
      screen.queryByRole("link", { name: "Let’s talk" }),
    ).not.toBeInTheDocument();
    rerender(
      <CareerClimbChart
        {...props}
        nextStage={{
          title: "Your team",
          description: "Open to senior engineering roles.",
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(
      screen.getAllByRole("button", { name: "Next stage: Your team" }),
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(
      screen.getAllByRole("button", { name: "Next stage: Your team" }).at(-1)!,
    );
    expect(
      screen.getByRole("heading", { name: "Your team" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Open to senior engineering roles."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Let’s talk" })).toHaveAttribute(
      "href",
      "#contact",
    );
  });

  it("opens the next stage from its flag and places navigation after the job content", () => {
    renderWithIntl(
      <CareerClimbChart
        experiences={experiences}
        viewAllLabel="View CV"
        referenceDate={new Date("2026-01-01")}
        nextStage={{
          title: "Your team",
          description: "Available for new roles.",
        }}
      />,
    );
    const navigation = screen.getByRole("group", {
      name: "Explore experience",
    });
    const heading = screen.getByRole("heading", { name: "Engineer" });
    expect(
      heading.compareDocumentPosition(navigation) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Next stage: Your team" })[0],
    );
    expect(
      screen.getByRole("heading", { name: "Your team" }),
    ).toBeInTheDocument();
  });

  it("keeps undated experience accessible without plotting a fabricated timeline", () => {
    renderWithIntl(
      <CareerClimbChart
        experiences={[{ ...experiences[0], startDate: null }]}
        viewAllLabel="View CV"
        referenceDate={new Date("2026-01-01")}
      />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Engineer" }),
    ).toBeInTheDocument();
  });

  it("returns no content for an empty tenant", () => {
    const { container } = renderWithIntl(
      <CareerClimbChart
        experiences={[]}
        viewAllLabel="View CV"
        referenceDate={new Date("2026-01-01")}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
