import { screen, waitFor } from "@testing-library/react";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { ContactGlobe } from "./contact-globe";

jest.mock("./globe-map-lazy", () => ({
  __esModule: true,
  default: () => <div data-testid="globe-map-mock" />,
}));

describe("ContactGlobe", () => {
  it("displays explicit GMT offset alongside the live local time and caption", async () => {
    renderWithIntl(
      <ContactGlobe
        location={{ lat: 12.1364, lon: -86.2514, label: "Managua, Nicaragua" }}
        timezone="America/Managua"
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/\(GMT-6\)/)).toHaveLength(2);
    });
    expect(screen.getByText(/Local time/)).toBeInTheDocument();
    expect(
      screen.getByText("I'm based in Managua, Nicaragua (GMT-6)."),
    ).toBeInTheDocument();
  });
});
