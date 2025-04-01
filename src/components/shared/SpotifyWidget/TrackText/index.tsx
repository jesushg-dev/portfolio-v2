import type { FC } from "react";
import React, { memo } from "react";
import ParallaxTex from "../../parallax-text";

interface ITrackTextProps {
  track: string;
  url: string;
}

const TrackText: FC<ITrackTextProps> = ({ track, url }) => {
  return (
    <ParallaxTex baseVelocity={-5}>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={url}
        className="mr-2 text-xl font-bold text-white/90 transition-all select-none hover:underline"
      >
        {track}
      </a>
    </ParallaxTex>
  );
};

export default memo(TrackText);
