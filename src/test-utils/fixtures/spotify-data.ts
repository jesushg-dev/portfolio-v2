import type {
  NowPlayingResponse,
  QueueResponse,
  RecentlyPlayedResponse,
} from "@/utils/interfaces/spotify";
import type { Episode, Track } from "@/utils/interfaces/spotify/entities";

const mockArtist = {
  id: "artist-1",
  name: "Daft Punk",
  href: "https://api.spotify.com/v1/artists/artist-1",
  type: "artist" as const,
  uri: "spotify:artist:artist-1" as const,
  external_urls: { spotify: "https://open.spotify.com/artist/artist-1" },
};

const mockSecondArtist = {
  id: "artist-2",
  name: "Pharrell Williams",
  href: "https://api.spotify.com/v1/artists/artist-2",
  type: "artist" as const,
  uri: "spotify:artist:artist-2" as const,
  external_urls: { spotify: "https://open.spotify.com/artist/artist-2" },
};

export const mockTrack: Track = {
  id: "track-1",
  name: "Get Lucky",
  type: "track",
  href: "https://api.spotify.com/v1/tracks/track-1",
  uri: "spotify:track:track-1",
  images: [],
  external_urls: { spotify: "https://open.spotify.com/track/track-1" },
  duration_ms: 248_000,
  explicit: false,
  is_local: false,
  preview_url: "https://p.scdn.co/preview.mp3",
  artists: [mockArtist, mockSecondArtist],
  album: {
    id: "album-1",
    name: "Random Access Memories",
    type: "album",
    href: "https://api.spotify.com/v1/albums/album-1",
    uri: "spotify:album:album-1",
    images: [
      {
        url: "https://i.scdn.co/image/album-cover",
        width: 300,
        height: 300,
      },
    ],
    external_urls: { spotify: "https://open.spotify.com/album/album-1" },
    artists: [mockArtist],
  },
};

export const mockExplicitTrack: Track = {
  ...mockTrack,
  id: "track-explicit",
  name: "Explicit Track",
  explicit: true,
};

export const mockShow = {
  id: "show-1",
  name: "Syntax FM",
  href: "https://api.spotify.com/v1/shows/show-1",
  uri: "spotify:show:show-1",
  type: "show" as const,
  images: [
    {
      url: "https://i.scdn.co/image/show-cover",
      width: 300,
      height: 300,
    },
  ],
  external_urls: { spotify: "https://open.spotify.com/show/show-1" },
};

export const mockEpisode: Episode = {
  id: "episode-1",
  name: "Taste the Cloud",
  href: "https://api.spotify.com/v1/episodes/episode-1",
  uri: "spotify:episode:episode-1",
  type: "episode",
  images: [],
  external_urls: { spotify: "https://open.spotify.com/episode/episode-1" },
  description: "A podcast episode about cloud computing.",
  duration_ms: 3_600_000,
  explicit: false,
  audio_preview_url: null,
  is_playable: true,
  is_externally_hosted: false,
  languages: ["en"],
  release_date: "2024-03-01",
  release_date_precision: "day",
  show: mockShow,
  resume_point: {
    fully_played: false,
    resume_position_ms: 120_000,
  },
};

export const mockNowPlayingTrack: NowPlayingResponse = {
  timestamp: 1_700_000_000_000,
  progress_ms: 45_000,
  is_playing: true,
  item: mockTrack,
  currently_playing_type: "track",
  context: {
    type: "playlist",
    href: "https://api.spotify.com/v1/playlists/playlist-1",
    uri: "spotify:playlist:playlist-1",
    external_urls: { spotify: "https://open.spotify.com/playlist/playlist-1" },
  },
  device: {
    id: "device-1",
    is_active: true,
    is_private_session: false,
    is_restricted: false,
    name: "Phone",
    type: "smartphone",
    volume_percent: 80,
  },
};

export const mockNowPlayingTrackNullItem: NowPlayingResponse = {
  ...mockNowPlayingTrack,
  item: null,
};

export const mockNowPlayingEpisodeNullItem: NowPlayingResponse = {
  timestamp: 1_700_000_000_000,
  progress_ms: 60_000,
  is_playing: true,
  item: null,
  currently_playing_type: "episode",
};

export const mockNowPlayingIdle: NowPlayingResponse = {
  timestamp: 1_700_000_000_000,
  progress_ms: 0,
  is_playing: false,
  item: mockTrack,
  currently_playing_type: "track",
};

export const mockQueueWithTrack: QueueResponse = {
  currently_playing: mockTrack,
  queue: [],
};

export const mockQueueWithEpisode: QueueResponse = {
  currently_playing: mockEpisode,
  queue: [],
};

export const mockRecentlyPlayed: RecentlyPlayedResponse = {
  href: "https://api.spotify.com/v1/me/player/recently-played?limit=1",
  limit: 1,
  next: null,
  cursors: {
    after: "after-cursor",
    before: "before-cursor",
  },
  items: [
    {
      track: mockTrack,
      played_at: "2024-01-15T10:30:00.000Z",
      context: {
        type: "album",
        href: "https://api.spotify.com/v1/albums/album-1",
        uri: "spotify:album:album-1",
        external_urls: { spotify: "https://open.spotify.com/album/album-1" },
      },
    },
  ],
};

export const mockRecentlyPlayedExplicit: RecentlyPlayedResponse = {
  ...mockRecentlyPlayed,
  items: [
    {
      track: mockExplicitTrack,
      played_at: "2024-01-15T10:30:00.000Z",
    },
  ],
};
