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
      className="mt-0.5 block truncate text-sm leading-tight font-bold text-white transition-colors select-none hover:underline"
      onClick={(event) => event.stopPropagation()}
    >
      {track}
    </a>
  );
};

export default memo(TrackText);
