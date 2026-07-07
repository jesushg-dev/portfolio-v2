import type { Image, SimplifiedArtist, SpotifyEntity } from "./entity";

interface Album extends SpotifyEntity {
  type: "album";
  popularity?: number;
  artists?: Array<SimplifiedArtist>;
  album_type?: "album" | "single" | "compilation";
  total_tracks?: number;
  release_date?: string;
  release_date_precision?: "year" | "month" | "day";
}

export interface Track extends SpotifyEntity {
  type: "track";
  popularity?: number;
  duration_ms: number;
  album: Album;
  artists: Array<SimplifiedArtist>;
  preview_url: string | null;
  is_playable?: boolean;
  is_local: boolean;
  explicit: boolean;
  disc_number?: number;
  track_number?: number;
}

export interface Show {
  id: string;
  name: string;
  href: string;
  uri: string;
  type: "show";
  images: Array<Image>;
  external_urls: { spotify: string };
  description?: string;
  html_description?: string;
  explicit?: boolean;
  languages?: string[];
  media_type?: string;
  total_episodes?: number;
  is_externally_hosted?: boolean;
}

export interface Episode {
  id: string;
  name: string;
  href: string;
  uri: string;
  type: "episode";
  images: Array<Image>;
  external_urls: { spotify: string };
  description: string;
  html_description?: string;
  duration_ms: number;
  explicit: boolean;
  audio_preview_url: string | null;
  is_playable: boolean;
  is_externally_hosted: boolean;
  languages: string[];
  release_date: string;
  release_date_precision: "year" | "month" | "day";
  show: Show;
  resume_point?: {
    fully_played: boolean;
    resume_position_ms: number;
  };
}

export interface ReadableTrack {
  name: string;
  artist: string;
  album: string;
  previewUrl: string;
  url: string;
  image?: Image;
}
