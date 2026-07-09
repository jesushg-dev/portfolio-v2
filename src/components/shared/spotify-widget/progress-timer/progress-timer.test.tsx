import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";

import ProgressTimer from "./index";

describe("ProgressTimer", () => {
  it("renders the current and total duration", () => {
    renderWithIntl(<ProgressTimer progressMs={45_000} durationMs={248_000} />);

    expect(screen.getByTitle("Current progress")).toHaveTextContent("00:45");
    expect(screen.getByTitle("Total duration")).toHaveTextContent("04:08");
  });

  it("clamps progress to the track duration", () => {
    renderWithIntl(<ProgressTimer progressMs={300_000} durationMs={248_000} />);

    expect(screen.getByTitle("Current progress")).toHaveTextContent("04:08");
  });

  it("reflects updated live progress from the provider", () => {
    const { rerender } = renderWithIntl(
      <ProgressTimer progressMs={45_000} durationMs={248_000} />,
    );

    rerender(<ProgressTimer progressMs={90_000} durationMs={248_000} />);

    expect(screen.getByTitle("Current progress")).toHaveTextContent("01:30");
  });
});
