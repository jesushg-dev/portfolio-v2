import { render, screen } from "@testing-library/react";
import React from "react";
import { HighlightMetrics } from "./highlight-metrics";

describe("HighlightMetrics", () => {
  it("renders plain text without modifications when no metrics exist", () => {
    render(<HighlightMetrics text="Built REST APIs and worked with team" />);
    expect(
      screen.getByText("Built REST APIs and worked with team"),
    ).toBeInTheDocument();
  });

  it("highlights percentages, numbers with plus, and ranges in bold", () => {
    const { container } = render(
      <HighlightMetrics text="Redujo incidentes en un 40% y ahorró 120+ horas con cobertura +30 pp y mejora de ~25%." />,
    );

    const bolds = container.querySelectorAll("strong");
    const boldTexts = Array.from(bolds).map((b) => b.textContent);

    expect(boldTexts).toContain("40%");
    expect(boldTexts).toContain("120+");
    expect(boldTexts).toContain("+30 pp");
    expect(boldTexts).toContain("~25%");
  });

  it("does not split or highlight abbreviations like E2E", () => {
    render(<HighlightMetrics text="Fortaleció calidad con E2E Playwright" />);
    expect(screen.getByText(/E2E Playwright/)).toBeInTheDocument();
  });
});
