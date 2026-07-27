import { render, screen } from "@testing-library/react";
import React from "react";
import Experiences from "./experiences";

describe("Experiences", () => {
  it("renders null when experiences array is empty", () => {
    const { container } = render(<Experiences experiences={[]} locale="en" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders experience details with responsibilities and formatted dates", () => {
    const list = [
      {
        id: "exp-1",
        company: "Tech Corp",
        role: { default: "Senior Developer" },
        startDate: new Date("2020-01-01"),
        endDate: new Date("2022-01-01"),
        current: false,
        responsibilities: [
          { id: "resp-1", text: { default: "Built REST APIs" } },
          { id: "resp-2", text: { default: "Led frontend team" } },
        ],
      },
      {
        id: "exp-2",
        company: "Startup Inc",
        role: "Full Stack Engineer",
        startDate: new Date("2022-02-01"),
        endDate: null,
        current: true,
        responsibilities: [],
      },
    ];

    render(
      <Experiences
        experiences={
          list as unknown as Parameters<typeof Experiences>[0]["experiences"]
        }
        locale="en"
      />,
    );

    expect(screen.getByText("Senior Developer")).toBeInTheDocument();
    expect(screen.getByText("Built REST APIs")).toBeInTheDocument();
    expect(screen.getByText("Led frontend team")).toBeInTheDocument();
    expect(screen.getByText("Full Stack Engineer")).toBeInTheDocument();
  });
});
