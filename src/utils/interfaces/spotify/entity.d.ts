export type SpotifyEntityType = "album" | "artist" | "playlist" | "track";
export type SpotifyEntityUri = `spotify:${SpotifyEntityType}:${string}`;

export interface SimplifiedArtist {
  external_urls: { spotify: string };
  href: string;
  id: string;
  name: string;
  type: "artist";
  uri: string;
}

export interface Image {
  url: string;
  height?: number | null;
  width?: number | null;
}

export interface SpotifyEntity {
  id: string;
  name: string;
  href: string;
  uri: SpotifyEntityUri;
  type: SpotifyEntityType;
  images: Image[];
  external_urls: { spotify: string };
}
