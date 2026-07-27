import { screen, fireEvent } from "@testing-library/react";
import React from "react";
import ProgressBar from "./progress-bar";
import ProgressTimer from "./progress-timer";
import { renderWithIntl } from "@/test-utils/render-with-intl";

describe("ProgressBar", () => {
  it("renders readOnly progressbar element", () => {
    renderWithIntl(
      <ProgressBar value={50} readOnly ariaLabel="Playback progress" />,
    );
    const bar = screen.getByRole("progressbar", { name: "Playback progress" });
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute("aria-valuenow", "50");
  });

  it("renders interactive range input when readOnly is false", () => {
    const onChange = jest.fn();
    renderWithIntl(
      <ProgressBar
        value={30}
        readOnly={false}
        onChange={onChange}
        ariaLabel="Interactive progress"
      />,
    );

    const slider = screen.getByRole("slider", { name: "Interactive progress" });
    expect(slider).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: "75" } });
    expect(onChange).toHaveBeenCalledWith(75);
  });
});

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
});
