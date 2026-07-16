import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";

import ProgressTimer from "./index";

describe("ProgressTimer", () => {
  it("renders the current and total duration", () => {
    renderWithIntl(<ProgressTimer progressMs={45_000} durationMs={248_000} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      String((45_000 / 248_000) * 100),
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-label",
      "Track playback progress",
    );

    const times = screen.getAllByText(/^\d{2}:\d{2}$/);
    expect(times[0]).toHaveTextContent("00:45");
    expect(times[1]).toHaveTextContent("04:08");
  });

  it("clamps progress to the track duration", () => {
    renderWithIntl(<ProgressTimer progressMs={300_000} durationMs={248_000} />);

    const times = screen.getAllByText("04:08");
    expect(times).toHaveLength(2);
  });

  it("reflects updated live progress from the provider", () => {
    const { rerender } = renderWithIntl(
      <ProgressTimer progressMs={45_000} durationMs={248_000} />,
    );

    rerender(<ProgressTimer progressMs={90_000} durationMs={248_000} />);

    expect(screen.getAllByText(/^\d{2}:\d{2}$/)[0]).toHaveTextContent("01:30");
  });
});
