import { renderHook, waitFor } from "@testing-library/react";

import {
  mockNowPlayingEpisodeNullItem,
  mockNowPlayingIdle,
  mockExplicitTrack,
  mockNowPlayingTrack,
  mockQueueWithEpisode,
  mockQueueWithTrack,
  mockRecentlyPlayed,
  mockRecentlyPlayedExplicit,
  mockTrack,
} from "@/test-utils/fixtures/spotify-data";
import { ETime } from "@/utils/constants/times";

import { useSpotifyPlayback } from "./use-spotify-playback";

interface QueryResult {
  data: unknown;
  isLoading: boolean;
  isFetching: boolean;
}

const emptyQueryResult = (): QueryResult => ({
  data: undefined,
  isLoading: false,
  isFetching: false,
});

const mockInvalidate = jest.fn();
const mockNowPlayingQuery = jest.fn(emptyQueryResult);
const mockQueueQuery = jest.fn(emptyQueryResult);
const mockRecentlyPlayedQuery = jest.fn(emptyQueryResult);

interface QueryOptions {
  refetchInterval?: (query: { state: { data: unknown } }) => number | false;
  enabled?: boolean;
}

let nowPlayingOptions: QueryOptions | undefined;
let queueOptions: QueryOptions | undefined;
let recentlyPlayedOptions: QueryOptions | undefined;

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      spotify: {
        getNowPlaying: { invalidate: mockInvalidate },
        getQueue: { invalidate: mockInvalidate },
        getRecentlyPlayed: { invalidate: mockInvalidate },
      },
    }),
    spotify: {
      getNowPlaying: {
        useQuery: (_input: unknown, options: QueryOptions): QueryResult => {
          nowPlayingOptions = options;
          return mockNowPlayingQuery();
        },
      },
      getQueue: {
        useQuery: (_input: unknown, options: QueryOptions): QueryResult => {
          queueOptions = options;
          return mockQueueQuery();
        },
      },
      getRecentlyPlayed: {
        useQuery: (_input: unknown, options: QueryOptions): QueryResult => {
          recentlyPlayedOptions = options;
          return mockRecentlyPlayedQuery();
        },
      },
    },
  },
}));

function mockQueryResult(
  data: unknown,
  overrides: Partial<{
    isLoading: boolean;
    isFetching: boolean;
  }> = {},
): QueryResult {
  return {
    data,
    isLoading: false,
    isFetching: false,
    ...overrides,
  };
}

describe("useSpotifyPlayback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nowPlayingOptions = undefined;
    queueOptions = undefined;
    recentlyPlayedOptions = undefined;

    mockNowPlayingQuery.mockReturnValue(
      mockQueryResult(mockNowPlayingTrack, { isLoading: true }),
    );
    mockQueueQuery.mockReturnValue(mockQueryResult(undefined));
    mockRecentlyPlayedQuery.mockReturnValue(mockQueryResult(undefined));
  });

  it("returns loading while now playing is fetching", () => {
    mockNowPlayingQuery.mockReturnValue(
      mockQueryResult(undefined, { isLoading: true }),
    );

    const { result } = renderHook(() => useSpotifyPlayback());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.playback).toBeNull();
  });

  it("maps an active track from now playing", async () => {
    mockNowPlayingQuery.mockReturnValue(mockQueryResult(mockNowPlayingTrack));

    const { result } = renderHook(() => useSpotifyPlayback());

    await waitFor(() => {
      expect(result.current.playback?.title).toBe("Get Lucky");
    });
    expect(result.current.playback?.source).toBe("now_playing");
    expect(result.current.error).toBeNull();
  });

  it("falls back to queue when track item is null", async () => {
    mockNowPlayingQuery.mockReturnValue(
      mockQueryResult({
        ...mockNowPlayingTrack,
        item: null,
      }),
    );
    mockQueueQuery.mockReturnValue(mockQueryResult(mockQueueWithTrack));

    const { result } = renderHook(() => useSpotifyPlayback());

    await waitFor(() => {
      expect(result.current.playback?.title).toBe("Get Lucky");
    });
    expect(mockQueueQuery).toHaveBeenCalled();
  });

  it("falls back to queue for podcast episodes with null item", async () => {
    mockNowPlayingQuery.mockReturnValue(
      mockQueryResult(mockNowPlayingEpisodeNullItem),
    );
    mockQueueQuery.mockReturnValue(mockQueryResult(mockQueueWithEpisode));

    const { result } = renderHook(() => useSpotifyPlayback());

    await waitFor(() => {
      expect(result.current.playback?.title).toBe("Taste the Cloud");
    });
    expect(result.current.playback?.contentType).toBe("episode");
    expect(result.current.playback?.subtitle).toBe("Syntax FM");
  });

  it("uses recently played when playback is idle", async () => {
    mockNowPlayingQuery.mockReturnValue(mockQueryResult(mockNowPlayingIdle));
    mockRecentlyPlayedQuery.mockReturnValue(
      mockQueryResult(mockRecentlyPlayed),
    );

    const { result } = renderHook(() => useSpotifyPlayback());

    await waitFor(() => {
      expect(result.current.playback?.source).toBe("recently_played");
    });
    expect(result.current.playback?.playedAt).toBe("2024-01-15T10:30:00.000Z");
  });

  it("uses recently played when now playing returns 204", async () => {
    mockNowPlayingQuery.mockReturnValue(
      mockQueryResult({ error: { status: 204, message: "No content" } }),
    );
    mockRecentlyPlayedQuery.mockReturnValue(
      mockQueryResult(mockRecentlyPlayed),
    );

    const { result } = renderHook(() => useSpotifyPlayback());

    await waitFor(() => {
      expect(result.current.playback?.source).toBe("recently_played");
    });
  });

  it("surfaces non-scope API errors", async () => {
    mockNowPlayingQuery.mockReturnValue(
      mockQueryResult({ error: { status: 500, message: "Server error" } }),
    );

    const { result } = renderHook(() => useSpotifyPlayback());

    await waitFor(() => {
      expect(result.current.error).toEqual({
        status: 500,
        message: "Server error",
      });
    });
    expect(result.current.playback).toBeNull();
  });

  it("hides insufficient scope errors", async () => {
    mockNowPlayingQuery.mockReturnValue(mockQueryResult(mockNowPlayingIdle));
    mockRecentlyPlayedQuery.mockReturnValue(
      mockQueryResult({
        error: { status: 403, message: "Insufficient client scope" },
      }),
    );

    const { result } = renderHook(() => useSpotifyPlayback());

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });

  it("falls back to recently played when now playing track is explicit", async () => {
    mockNowPlayingQuery.mockReturnValue(
      mockQueryResult({
        ...mockNowPlayingTrack,
        item: { ...mockExplicitTrack },
      }),
    );
    mockRecentlyPlayedQuery.mockReturnValue(
      mockQueryResult(mockRecentlyPlayed),
    );

    const { result } = renderHook(() => useSpotifyPlayback());

    await waitFor(() => {
      expect(recentlyPlayedOptions?.enabled).toBe(true);
      expect(result.current.playback?.source).toBe("recently_played");
      expect(result.current.playback?.title).toBe("Get Lucky");
    });
  });

  it("returns null when now playing and recently played are both explicit", async () => {
    mockNowPlayingQuery.mockReturnValue(
      mockQueryResult({
        ...mockNowPlayingTrack,
        item: { ...mockExplicitTrack },
      }),
    );
    mockRecentlyPlayedQuery.mockReturnValue(
      mockQueryResult(mockRecentlyPlayedExplicit),
    );

    const { result } = renderHook(() => useSpotifyPlayback());

    await waitFor(() => {
      expect(result.current.playback).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  it("keeps loading while queue fallback is fetching", () => {
    mockNowPlayingQuery.mockReturnValue(
      mockQueryResult({
        ...mockNowPlayingTrack,
        item: null,
      }),
    );
    mockQueueQuery.mockReturnValue(
      mockQueryResult(undefined, { isLoading: true }),
    );

    const { result } = renderHook(() => useSpotifyPlayback());

    expect(result.current.isLoading).toBe(true);
    expect(queueOptions?.enabled).toBe(true);
  });

  it("invalidates spotify queries when active playback stops", async () => {
    mockNowPlayingQuery.mockReturnValue(mockQueryResult(mockNowPlayingTrack));
    mockRecentlyPlayedQuery.mockReturnValue(
      mockQueryResult(mockRecentlyPlayed),
    );

    const { result, rerender } = renderHook(() => useSpotifyPlayback());

    await waitFor(() => {
      expect(result.current.playback?.isPlaying).toBe(true);
    });

    mockNowPlayingQuery.mockReturnValue(mockQueryResult(mockNowPlayingIdle));
    rerender();

    await waitFor(() => {
      expect(mockInvalidate).toHaveBeenCalled();
    });
  });

  it("uses a faster poll interval near the end of a track", () => {
    mockNowPlayingQuery.mockReturnValue(mockQueryResult(mockNowPlayingTrack));

    renderHook(() => useSpotifyPlayback());

    const interval = nowPlayingOptions?.refetchInterval?.({
      state: {
        data: {
          ...mockNowPlayingTrack,
          progress_ms: 220_000,
        },
      },
    });

    expect(interval).toBe(5 * ETime.SECOND);
  });

  it("uses the default poll interval during regular playback", () => {
    mockNowPlayingQuery.mockReturnValue(mockQueryResult(mockNowPlayingTrack));

    renderHook(() => useSpotifyPlayback());

    const interval = nowPlayingOptions?.refetchInterval?.({
      state: { data: mockNowPlayingTrack },
    });

    expect(interval).toBe(ETime.HALF_MINUTE);
  });

  it("uses the idle poll interval when nothing is actively playing", () => {
    mockNowPlayingQuery.mockReturnValue(mockQueryResult(mockNowPlayingIdle));

    renderHook(() => useSpotifyPlayback());

    const interval = nowPlayingOptions?.refetchInterval?.({
      state: { data: mockNowPlayingIdle },
    });

    expect(interval).toBe(15 * ETime.SECOND);
  });

  it("does not fall back to recently played while now playing is refetching", () => {
    mockNowPlayingQuery.mockReturnValue(
      mockQueryResult(mockNowPlayingIdle, { isFetching: true }),
    );
    mockRecentlyPlayedQuery.mockReturnValue(
      mockQueryResult(mockRecentlyPlayed),
    );

    const { result } = renderHook(() => useSpotifyPlayback());

    expect(result.current.playback).toBeNull();
  });

  it("keeps the last playback visible during transient refetch errors", async () => {
    mockNowPlayingQuery.mockReturnValue(mockQueryResult(mockNowPlayingTrack));

    const { result, rerender } = renderHook(() => useSpotifyPlayback());

    await waitFor(() => {
      expect(result.current.playback?.title).toBe("Get Lucky");
    });

    mockNowPlayingQuery.mockReturnValue(
      mockQueryResult(
        { error: { status: 502, message: "Spotify temporarily unavailable" } },
        { isFetching: true },
      ),
    );
    rerender();

    expect(result.current.playback?.title).toBe("Get Lucky");
    expect(result.current.error).toBeNull();
  });

  it("fetches queue while an active track is playing", () => {
    const nextTrack = { ...mockTrack, id: "track-next", name: "Next Song" };

    mockNowPlayingQuery.mockReturnValue(mockQueryResult(mockNowPlayingTrack));
    mockQueueQuery.mockReturnValue(
      mockQueryResult({
        currently_playing: mockTrack,
        queue: [nextTrack],
      }),
    );

    const { result } = renderHook(() => useSpotifyPlayback());

    expect(queueOptions?.enabled).toBe(true);
    expect(result.current.nextTrackLyrics).toEqual({
      contentId: "track-next",
      title: "Next Song",
      artist: "Daft Punk",
      album: "Random Access Memories",
      durationMs: 248_000,
    });
  });
});
