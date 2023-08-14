import React, { FC, memo } from 'react';

import Marquee from 'react-fast-marquee';

interface ITrackTextProps {
  track: string;
  url: string;
}

const TrackText: FC<ITrackTextProps> = ({ track, url }) => {
  return (
    <Marquee speed={40} autoFill={true} pauseOnHover={true} pauseOnClick={true} delay={0} direction="left">
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={url}
        className="text-white/90 text-xl font-bold select-none hover:underline transition-all  mr-2">
        {track} |{' '}
      </a>
    </Marquee>
  );
};

export default memo(TrackText);
