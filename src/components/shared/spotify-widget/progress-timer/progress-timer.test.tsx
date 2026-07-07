import { screen, act } from "@testing-library/react";

import { ETime } from "@/utils/constants/times";
import { renderWithIntl } from "@/test-utils/render-with-intl";

import ProgressTimer from "./index";

describe("ProgressTimer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the current and total duration", () => {
    renderWithIntl(
      <ProgressTimer progressMs={45_000} durationMs={248_000} isPlaying={false} />,
    );

    expect(screen.getByTitle("Current progress")).toHaveTextContent("00:45");
    expect(screen.getByTitle("Total duration")).toHaveTextContent("04:08");
  });

  it("advances progress while playing", () => {
    renderWithIntl(
      <ProgressTimer progressMs={45_000} durationMs={248_000} isPlaying />,
    );

    act(() => {
      jest.advanceTimersByTime(ETime.SECOND);
    });

    expect(screen.getByTitle("Current progress")).toHaveTextContent("00:46");
  });

  it("syncs when the server progress changes", () => {
    const { rerender } = renderWithIntl(
      <ProgressTimer progressMs={45_000} durationMs={248_000} isPlaying={false} />,
    );

    rerender(
      <ProgressTimer progressMs={90_000} durationMs={248_000} isPlaying={false} />,
    );

    expect(screen.getByTitle("Current progress")).toHaveTextContent("01:30");
  });

  it("does not advance when playback is paused", () => {
    renderWithIntl(
      <ProgressTimer progressMs={45_000} durationMs={248_000} isPlaying={false} />,
    );

    act(() => {
      jest.advanceTimersByTime(ETime.SECOND * 3);
    });

    expect(screen.getByTitle("Current progress")).toHaveTextContent("00:45");
  });
});
