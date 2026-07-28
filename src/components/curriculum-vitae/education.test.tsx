import { screen } from "@testing-library/react";

import Education from "./education";
import { mockEducation } from "@/test-utils/fixtures/cv-data";
import { renderWithIntl } from "@/test-utils/render-with-intl";

describe("Education", () => {
  it("renders nothing when educations array is empty", () => {
    const { container } = renderWithIntl(
      <Education educations={[]} locale="en" defaultLocale="en" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders localized degree name for the current locale", () => {
    renderWithIntl(
      <Education educations={[mockEducation]} locale="es" defaultLocale="en" />,
    );
    expect(screen.getByText("Ciencias de la Computación")).toBeInTheDocument();
    expect(screen.getByText(/Test University/)).toBeInTheDocument();
  });

  it("renders section heading", () => {
    renderWithIntl(
      <Education educations={[mockEducation]} locale="en" defaultLocale="en" />,
    );
    expect(screen.getByText("Education")).toBeInTheDocument();
  });

  it("formats dates using startYear and endYear when dates prop is missing", () => {
    const eduWithYears = {
      ...mockEducation,
      dates: null,
      startYear: 2018,
      endYear: 2022,
      location: { default: "Madrid, Spain" },
    };

    renderWithIntl(
      <Education educations={[eduWithYears]} locale="en" defaultLocale="en" />,
    );

    expect(screen.getByText("2018 - 2022")).toBeInTheDocument();
    expect(screen.getByText(/Madrid, Spain/)).toBeInTheDocument();
  });

  it("omits dates and location when they are not provided", () => {
    const minimalEdu = {
      ...mockEducation,
      dates: null,
      startYear: null,
      endYear: null,
      location: null,
    };

    renderWithIntl(
      <Education educations={[minimalEdu]} locale="en" defaultLocale="en" />,
    );

    expect(screen.getByText("Computer Science")).toBeInTheDocument();
  });
});
