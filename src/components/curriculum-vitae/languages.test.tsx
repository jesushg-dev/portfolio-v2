import { screen } from "@testing-library/react";

import Languages from "./languages";
import { mockLanguage } from "@/test-utils/fixtures/cv-data";
import { renderWithIntl } from "@/test-utils/render-with-intl";

describe("Languages", () => {
  it("renders nothing when languages array is empty", () => {
    const { container } = renderWithIntl(
      <Languages languages={[]} locale="en" defaultLocale="en" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders localized language name and level", () => {
    renderWithIntl(
      <Languages languages={[mockLanguage]} locale="es" defaultLocale="en" />,
    );
    expect(screen.getByText("Inglés")).toBeInTheDocument();
    expect(screen.getByText("Fluido")).toBeInTheDocument();
  });
});
