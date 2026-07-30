import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";

import ProgressTimer from "./progress-timer";

describe("ProgressTimer", () => {
  it("renders formatted current and total time", () => {
    renderWithIntl(<ProgressTimer progressMs={60000} durationMs={180000} />);
    expect(screen.getByText("01:00")).toBeInTheDocument();
    expect(screen.getByText("03:00")).toBeInTheDocument();
  });

  it("handles durationMs 0 and isHidden prop", () => {
    const { container } = renderWithIntl(
      <ProgressTimer progressMs={0} durationMs={0} isHidden={true} />,
    );
    expect(container.firstChild).toHaveClass("hidden");
  });

  it("clamps progress to duration", () => {
    renderWithIntl(<ProgressTimer progressMs={300_000} durationMs={248_000} />);
    const times = screen.getAllByText("04:08");
    expect(times).toHaveLength(2);
  });
});
