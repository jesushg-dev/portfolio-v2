import { render, screen } from "@testing-library/react";
import React from "react";
import TechnicalSkills from "./technical-skills";

describe("TechnicalSkills", () => {
  it("renders null when technicalSkills is empty", () => {
    const { container } = render(<TechnicalSkills technicalSkills={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders technical skills sections and items", () => {
    const skills = [
      {
        id: "1",
        category: "FRONTEND" as const,
        items: ["React", "TypeScript", "Next.js"],
      },
      {
        id: "2",
        category: "BACKEND" as const,
        items: ["Node.js", "PostgreSQL"],
      },
    ];

    render(<TechnicalSkills technicalSkills={skills} />);

    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
  });
});
