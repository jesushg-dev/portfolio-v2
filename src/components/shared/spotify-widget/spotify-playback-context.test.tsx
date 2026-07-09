import { screen } from "@testing-library/react";

import {
  mockNowPlayingTrack,
  mockTrack,
} from "@/test-utils/fixtures/spotify-data";
import { renderWithIntl } from "@/test-utils/render-with-intl";

import { mapTrackNowPlaying } from "./playback-mappers";
import {
  SpotifyPlaybackProvider,
  useSpotifyPlaybackContext,
} from "./spotify-playback-context";

function ProgressReadout() {
  const { liveProgressMs } = useSpotifyPlaybackContext();
  return <span data-testid="progress">{liveProgressMs}</span>;
}

describe("SpotifyPlaybackProvider", () => {
  it("remounts the clock when contentId changes", () => {
    const firstTrack = mapTrackNowPlaying(mockTrack, {
      ...mockNowPlayingTrack,
      progress_ms: 175_000,
    });

    const secondTrack = mapTrackNowPlaying(
      { ...mockTrack, id: "track-2", name: "Next Track" },
      {
        ...mockNowPlayingTrack,
        progress_ms: 4_000,
        timestamp: mockNowPlayingTrack.timestamp + 1,
      },
    );

    const { rerender } = renderWithIntl(
      <SpotifyPlaybackProvider playback={firstTrack}>
        <ProgressReadout />
      </SpotifyPlaybackProvider>,
    );

    expect(screen.getByTestId("progress")).toHaveTextContent("175000");

    rerender(
      <SpotifyPlaybackProvider playback={secondTrack}>
        <ProgressReadout />
      </SpotifyPlaybackProvider>,
    );

    expect(screen.getByTestId("progress")).toHaveTextContent("4000");
  });
});
