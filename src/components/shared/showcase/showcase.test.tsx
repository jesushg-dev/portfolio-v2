import { render, screen } from "@testing-library/react";
import React from "react";
import {
  ShowcaseShell,
  ShowcaseHero,
  ShowcaseSection,
  ShowcaseHeading,
  MetricGrid,
  ShowcaseTerminal,
  ServiceList,
  ShowcaseAccordion,
} from "./index";

describe("Showcase Primitives Design System", () => {
  it("renders ShowcaseShell with default main tag", () => {
    const { container } = render(
      <ShowcaseShell>
        <div>Content</div>
      </ShowcaseShell>,
    );
    expect(container.querySelector("main")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders ShowcaseHero in centered mode with title and eyebrow", () => {
    render(
      <ShowcaseHero
        eyebrow="Public stats"
        title="Site usage"
        description="Anonymous measurement"
      />,
    );
    expect(screen.getByText("Public stats")).toBeInTheDocument();
    expect(screen.getByText(/Site usage/)).toBeInTheDocument();
    expect(screen.getByText("Anonymous measurement")).toBeInTheDocument();
  });

  it("renders ShowcaseHero in split mode with pill and visual slot", () => {
    render(
      <ShowcaseHero
        align="split"
        pill={{ text: "Open to work" }}
        title="Hello, I’m"
        titleHighlight="Jesús"
        visual={<div data-testid="portrait">Portrait</div>}
      />,
    );
    expect(screen.getByText("Open to work")).toBeInTheDocument();
    expect(screen.getByText("Jesús")).toBeInTheDocument();
    expect(screen.getByTestId("portrait")).toBeInTheDocument();
  });

  it("renders ShowcaseSection with default and tile variants", () => {
    const { rerender } = render(
      <ShowcaseSection id="test-sec">Section body</ShowcaseSection>,
    );
    expect(screen.getByText("Section body")).toBeInTheDocument();

    rerender(
      <ShowcaseSection variant="tile-brand">Brand Tile</ShowcaseSection>,
    );
    expect(screen.getByText("Brand Tile")).toBeInTheDocument();

    rerender(<ShowcaseSection variant="tile-dark">Dark Tile</ShowcaseSection>);
    expect(screen.getByText("Dark Tile")).toBeInTheDocument();
  });

  it("renders ShowcaseHeading with center and split layouts", () => {
    const { rerender } = render(
      <ShowcaseHeading
        eyebrow="Portfolio"
        title="Selected work"
        titleGradient="."
        description="Highlights"
      />,
    );
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
    expect(screen.getByText(/Selected work/)).toBeInTheDocument();

    rerender(
      <ShowcaseHeading
        align="split"
        title="Expertise"
        action={<button type="button">See stack</button>}
      />,
    );
    expect(screen.getByText("Expertise")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "See stack" }),
    ).toBeInTheDocument();
  });

  it("renders MetricGrid with tabular numbers and labels", () => {
    render(
      <MetricGrid
        columns={3}
        items={[
          { label: "Visits", value: "589" },
          { label: "Countries", value: "11" },
        ]}
      />,
    );
    expect(screen.getByText("589")).toBeInTheDocument();
    expect(screen.getByText("Visits")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
  });

  it("renders ShowcaseTerminal with title bar and children", () => {
    render(
      <ShowcaseTerminal title="system.log">
        <code>Status: operational</code>
      </ShowcaseTerminal>,
    );
    expect(screen.getByText("system.log")).toBeInTheDocument();
    expect(screen.getByText("Status: operational")).toBeInTheDocument();
  });

  it("renders ServiceList with name and category badges", () => {
    render(
      <ServiceList
        items={[
          { title: "Frontend Development", badge: "WEB" },
          { title: "Microservices", badge: "BACKEND" },
        ]}
      />,
    );
    expect(screen.getByText("Frontend Development")).toBeInTheDocument();
    expect(screen.getByText("WEB")).toBeInTheDocument();
    expect(screen.getByText("Microservices")).toBeInTheDocument();
  });

  it("renders ShowcaseAccordion with items and summaries", () => {
    render(
      <ShowcaseAccordion
        items={[
          { question: "Are you available?", answer: "Yes, immediately." },
          { question: "Where are you based?", answer: "Managua, Nicaragua." },
        ]}
      />,
    );
    expect(screen.getByText("Are you available?")).toBeInTheDocument();
    expect(screen.getByText("Yes, immediately.")).toBeInTheDocument();
    expect(screen.getByText("Where are you based?")).toBeInTheDocument();
    expect(screen.getByText("Managua, Nicaragua.")).toBeInTheDocument();
  });
});
