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
      className="mt-0.5 block min-h-6 w-full max-w-full truncate py-0.5 text-xs text-white/80 transition-colors select-none hover:text-white hover:underline"
      onClick={(event) => event.stopPropagation()}
    >
      {artistsText}
    </a>
  );
};

export default memo(ArtistText);
