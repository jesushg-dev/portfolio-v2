import { screen } from "@testing-library/react";

import Education from "./education";
import {
  mockAppLanguages,
  mockEducation,
  mockCvPreviewData,
} from "@/test-utils/fixtures/cv-data";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { mapCvDataToLocalized } from "./types";

function getLocalizedEdu(
  edu: typeof mockEducation,
  locale: "en" | "es" = "en",
) {
  return mapCvDataToLocalized(
    { ...mockCvPreviewData, educations: [edu] },
    mockAppLanguages,
    locale,
  ).educations[0];
}

describe("Education", () => {
  it("renders nothing when educations array is empty", () => {
    const { container } = renderWithIntl(<Education educations={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders localized degree name for the current locale", () => {
    renderWithIntl(
      <Education educations={[getLocalizedEdu(mockEducation, "es")]} />,
    );
    expect(screen.getByText("Ciencias de la Computación")).toBeInTheDocument();
    expect(screen.getByText(/Test University/)).toBeInTheDocument();
  });

  it("renders section heading", () => {
    renderWithIntl(<Education educations={[getLocalizedEdu(mockEducation)]} />);
    expect(screen.getByText("Education")).toBeInTheDocument();
  });

  it("formats dates using startYear and endYear when dates prop is missing", () => {
    const eduWithYears = {
      ...mockEducation,
      dates: null,
      startYear: 2018,
      endYear: 2022,
      translations: mockEducation.translations.map((translation) =>
        translation.appLanguageId === "lang-en"
          ? { ...translation, location: "Madrid, Spain" }
          : translation,
      ),
    };

    renderWithIntl(<Education educations={[getLocalizedEdu(eduWithYears)]} />);

    expect(screen.getByText("2018 - 2022")).toBeInTheDocument();
    expect(screen.getByText(/Madrid, Spain/)).toBeInTheDocument();
  });

  it("omits dates and location when they are not provided", () => {
    const minimalEdu = {
      ...mockEducation,
      dates: null,
      startYear: null,
      endYear: null,
      translations: mockEducation.translations.map((translation) => ({
        ...translation,
        location: null,
      })),
    };

    renderWithIntl(<Education educations={[getLocalizedEdu(minimalEdu)]} />);

    expect(screen.getByText("Computer Science")).toBeInTheDocument();
  });
});
