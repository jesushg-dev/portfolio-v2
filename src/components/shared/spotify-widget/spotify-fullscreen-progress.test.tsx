import { screen, act } from "@testing-library/react";

import { ETime } from "@/utils/constants/times";
import { renderWithIntl } from "@/test-utils/render-with-intl";

import SpotifyFullscreenProgress from "./spotify-fullscreen-progress";

describe("SpotifyFullscreenProgress", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders elapsed and remaining time", () => {
    renderWithIntl(
      <SpotifyFullscreenProgress
        progressMs={60_000}
        durationMs={3_600_000}
        isPlaying={false}
      />,
    );

    expect(screen.getByText("01:00")).toBeInTheDocument();
    expect(screen.getByText("-59:00")).toBeInTheDocument();
  });

  it("advances while playing", () => {
    renderWithIntl(
      <SpotifyFullscreenProgress
        progressMs={60_000}
        durationMs={3_600_000}
        isPlaying
      />,
    );

    act(() => {
      jest.advanceTimersByTime(ETime.SECOND);
    });

    expect(screen.getByText("01:01")).toBeInTheDocument();
  });
});
