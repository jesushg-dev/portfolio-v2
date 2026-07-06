import type { FC } from "react";
import { memo, useMemo } from "react";

interface IArtistTextProps {
  artists: string[];
  url: string;
}

const ArtistText: FC<IArtistTextProps> = ({ artists, url }) => {
  const artistsText = useMemo(
    () =>
      artists.length > 2
        ? `${artists.slice(0, -1).join(", ")} & ${artists[artists.length - 1]}`
        : artists.join(" feat "),
    [artists],
  );

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={artistsText}
      className="block truncate text-sm font-semibold text-gray-400/90 transition-all select-none hover:underline"
    >
      {artistsText}
    </a>
  );
};

export default memo(ArtistText);
