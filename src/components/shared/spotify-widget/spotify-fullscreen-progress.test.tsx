import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";

import SpotifyFullscreenProgress from "./spotify-fullscreen-progress";

describe("SpotifyFullscreenProgress", () => {
  it("renders elapsed and remaining time", () => {
    renderWithIntl(
      <SpotifyFullscreenProgress progressMs={60_000} durationMs={3_600_000} />,
    );

    expect(screen.getByText("01:00")).toBeInTheDocument();
    expect(screen.getByText("-59:00")).toBeInTheDocument();
  });

  it("reflects the live progress value from the parent", () => {
    const { rerender } = renderWithIntl(
      <SpotifyFullscreenProgress progressMs={60_000} durationMs={3_600_000} />,
    );

    rerender(
      <SpotifyFullscreenProgress progressMs={61_000} durationMs={3_600_000} />,
    );

    expect(screen.getByText("01:01")).toBeInTheDocument();
  });
});
