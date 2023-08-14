import React, { FC, memo, useMemo } from 'react';

import Marquee from 'react-fast-marquee';

interface IArtistTextProps {
  artists: string[];
  url: string;
}

const ArtistText: FC<IArtistTextProps> = ({ artists, url }) => {
  const artistsText = useMemo(() => artists.join(', '), [artists]);

  return (
    <Marquee speed={40} autoFill={true} pauseOnHover={true} pauseOnClick={true} delay={0} direction="left">
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={url}
        className="text-gray-400/90 text-sm font-semibold select-none hover:underline transition-all mr-2">
        {artistsText} |{' '}
      </a>
    </Marquee>
  );
};

export default memo(ArtistText);
