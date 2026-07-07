import { screen } from "@testing-library/react";

import SoftSkills from "./soft-skills";
import { mockSoftSkill } from "@/test-utils/fixtures/cv-data";
import { renderWithIntl } from "@/test-utils/render-with-intl";

describe("SoftSkills", () => {
  it("renders nothing when soft skills array is empty", () => {
    const { container } = renderWithIntl(
      <SoftSkills softSkills={[]} locale="en" defaultLocale="en" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders localized soft skill names", () => {
    renderWithIntl(
      <SoftSkills
        softSkills={[mockSoftSkill]}
        locale="es"
        defaultLocale="en"
      />,
    );
    expect(screen.getByText("Trabajo en equipo.")).toBeInTheDocument();
  });
});
