import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";
import SoftSkillsBento, { type SoftSkillBentoItem } from "./soft-skills-bento";

const mockItems: SoftSkillBentoItem[] = [
  {
    id: "item-1",
    icon: "RiTeamLine",
    title: "Technical Team Governance",
    description: "Directed an engineering team of 6 developers.",
    badge: "6 Developers Led",
    featured: true,
  },
  {
    id: "item-2",
    icon: "RiUserStarLine",
    title: "Engineering Mentorship",
    description: "Mentored 4 engineers through code reviews.",
    badge: "Code Reviews",
    featured: false,
  },
];

describe("SoftSkillsBento", () => {
  it("renders empty when items array is empty", () => {
    const { container } = renderWithIntl(<SoftSkillsBento items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders leadership header, metrics, and timeline items", () => {
    renderWithIntl(
      <SoftSkillsBento
        items={mockItems}
        metrics={[
          { value: "6", label: "developers led" },
          { value: "4", label: "engineers mentored" },
          { value: "40%", label: "fewer production defects" },
          { value: "40%", label: "lower MTTR" },
        ]}
      />,
    );

    expect(screen.getByText("Technical Team Governance")).toBeInTheDocument();
    expect(
      screen.getByText("Directed an engineering team of 6 developers."),
    ).toBeInTheDocument();
    expect(screen.getByText("6 Developers Led")).toBeInTheDocument();

    expect(screen.getByText("Engineering Mentorship")).toBeInTheDocument();
    expect(
      screen.getByText("Mentored 4 engineers through code reviews."),
    ).toBeInTheDocument();
    expect(screen.getByText("Code Reviews")).toBeInTheDocument();

    // Check impact numbers & labels
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("developers led")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("engineers mentored")).toBeInTheDocument();
    expect(screen.getAllByText("40%")).toHaveLength(2);
    expect(screen.getByText("fewer production defects")).toBeInTheDocument();
    expect(screen.getByText("lower MTTR")).toBeInTheDocument();
  });
});
