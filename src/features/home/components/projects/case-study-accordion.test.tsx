import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";

import { CaseStudyAccordion } from "./case-study-accordion";
import type { CaseStudyDecision } from "./types";

const decisions: CaseStudyDecision[] = [
  {
    title: "Feature-based architecture",
    summary: "Group code by domain.",
    why: "It keeps modules independent.",
    alternatives: ["Layer-based folders"],
    trade: "Shared code needs boundaries.",
  },
];

describe("CaseStudyAccordion", () => {
  it("expands and collapses a decision with accessible controls", () => {
    renderWithIntl(<CaseStudyAccordion decisions={decisions} />);

    const trigger = screen.getByRole("button", {
      name: /feature-based architecture/i,
    });
    const panel = screen.getByRole("region", {
      name: /feature-based architecture/i,
    });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("data-state", "closed");

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(panel).toHaveAttribute("data-state", "open");

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("data-state", "closed");
  });
});
