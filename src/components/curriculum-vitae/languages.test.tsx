import { screen } from "@testing-library/react";

import Languages from "./languages";
import {
  mockLanguage,
  mockAppLanguages,
  mockCvPreviewData,
} from "@/test-utils/fixtures/cv-data";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { mapCvDataToLocalized } from "./types";

function getLocalizedLang(
  lang: typeof mockLanguage,
  locale: "en" | "es" = "en",
) {
  return mapCvDataToLocalized(
    { ...mockCvPreviewData, languages: [lang] },
    mockAppLanguages,
    locale,
  ).languages[0];
}

describe("Languages", () => {
  it("renders nothing when languages array is empty", () => {
    const { container } = renderWithIntl(<Languages languages={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders localized language name and level", () => {
    renderWithIntl(
      <Languages languages={[getLocalizedLang(mockLanguage, "es")]} />,
    );
    expect(screen.getByText("Inglés")).toBeInTheDocument();
    expect(screen.getByText("Fluido")).toBeInTheDocument();
  });
});
