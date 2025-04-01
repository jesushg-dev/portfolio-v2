import type { FC } from "react";
import React, { memo, useMemo } from "react";
import ParallaxTex from "../../parallax-text";

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
    <ParallaxTex baseVelocity={-5}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mr-2 text-sm font-semibold text-gray-400/90 transition-all select-none hover:underline"
      >
        {artistsText}
      </a>
    </ParallaxTex>
  );
};

export default memo(ArtistText);
