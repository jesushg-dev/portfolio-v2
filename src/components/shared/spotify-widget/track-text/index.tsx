import type { FC } from "react";
import { memo } from "react";

interface ITrackTextProps {
  track: string;
  url: string;
}

const TrackText: FC<ITrackTextProps> = ({ track, url }) => {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={url}
      title={track}
      className="mt-1 block truncate text-xl font-bold text-white/90 transition-all select-none hover:underline"
    >
      {track}
    </a>
  );
};

export default memo(TrackText);
