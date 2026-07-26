import { screen } from "@testing-library/react";

import CvPreview from "./cv-preview";
import { mockCvPreviewData } from "@/test-utils/fixtures/cv-data";
import { renderWithIntl } from "@/test-utils/render-with-intl";

describe("CvPreview", () => {
  it("renders about me section when aboutMeText is provided", () => {
    renderWithIntl(
      <CvPreview
        data={mockCvPreviewData}
        aboutMeText="Passionate developer with 5 years of experience."
        currentLocale="en"
        defaultLocale="en"
      />,
    );
    expect(screen.getByText("About Me")).toBeInTheDocument();
    expect(
      screen.getByText("Passionate developer with 5 years of experience."),
    ).toBeInTheDocument();
  });

  it("does not render about me section when aboutMeText is null", () => {
    renderWithIntl(
      <CvPreview
        data={mockCvPreviewData}
        aboutMeText={null}
        currentLocale="en"
        defaultLocale="en"
      />,
    );
    expect(screen.queryByText("About Me")).not.toBeInTheDocument();
  });

  it("renders header with profile name", () => {
    renderWithIntl(
      <CvPreview
        data={mockCvPreviewData}
        aboutMeText={null}
        currentLocale="en"
        defaultLocale="en"
      />,
    );
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders with pdfMode styling when pdfMode is true", () => {
    const { container } = renderWithIntl(
      <CvPreview
        data={mockCvPreviewData}
        aboutMeText={null}
        currentLocale="en"
        defaultLocale="en"
        pdfMode={true}
      />,
    );

    expect(container.querySelector(".px-5.pt-2")).toBeInTheDocument();
  });
});

