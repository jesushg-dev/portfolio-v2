import type { FC } from "react";
import React, { memo } from "react";
import Marquee from "react-fast-marquee";

interface ITrackTextProps {
  track: string;
  url: string;
}

const TrackText: FC<ITrackTextProps> = ({ track, url }) => {
  return (
    <Marquee
      speed={40}
      autoFill
      pauseOnHover
      pauseOnClick
      delay={0}
      direction="left"
    >
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={url}
        className="mr-2 select-none text-xl font-bold text-white/90 transition-all  hover:underline"
      >
        {track} |{" "}
      </a>
    </Marquee>
  );
};

export default memo(TrackText);
