import {
  mockEpisode,
  mockQueueWithTrack,
  mockTrack,
} from "@/test-utils/fixtures/spotify-data";

import {
  resolveNextQueuedTrack,
  trackToLyricsRequest,
} from "./playback-mappers";

describe("trackToLyricsRequest", () => {
  it("maps spotify track metadata for lyrics lookup", () => {
    expect(trackToLyricsRequest(mockTrack)).toEqual({
      contentId: "track-1",
      title: "Get Lucky",
      artist: "Daft Punk",
      album: "Random Access Memories",
      durationMs: 248_000,
    });
  });
});

describe("resolveNextQueuedTrack", () => {
  it("returns the first upcoming non-explicit track in the queue", () => {
    const nextTrack = {
      ...mockTrack,
      id: "track-next",
      name: "Next Song",
    };

    const result = resolveNextQueuedTrack(
      {
        currently_playing: mockTrack,
        queue: [nextTrack, mockEpisode],
      },
      mockTrack.id,
    );

    expect(result?.id).toBe("track-next");
  });

  it("returns null when the queue has no further tracks", () => {
    expect(
      resolveNextQueuedTrack(
        {
          currently_playing: mockTrack,
          queue: [],
        },
        mockTrack.id,
      ),
    ).toBeNull();
  });

  it("skips the currently playing id if it appears in the queue", () => {
    expect(resolveNextQueuedTrack(mockQueueWithTrack, mockTrack.id)).toBeNull();
  });
});
