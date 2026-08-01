import { screen } from "@testing-library/react";

import SoftSkills from "./soft-skills";
import {
  mockSoftSkill,
  mockAppLanguages,
  mockCvPreviewData,
} from "@/test-utils/fixtures/cv-data";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { mapCvDataToLocalized } from "./types";

function getLocalizedSoftSkill(skill: typeof mockSoftSkill, locale: "en" | "es" = "en") {
  return mapCvDataToLocalized(
    { ...mockCvPreviewData, softSkills: [skill] },
    mockAppLanguages,
    locale
  ).softSkills[0];
}

describe("SoftSkills", () => {
  it("renders nothing when soft skills array is empty", () => {
    const { container } = renderWithIntl(
      <SoftSkills softSkills={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders localized soft skill names", () => {
    renderWithIntl(<SoftSkills softSkills={[getLocalizedSoftSkill(mockSoftSkill, "es")]} />);
    expect(screen.getByText("Trabajo en equipo.")).toBeInTheDocument();
  });
});
