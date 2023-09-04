import React, { FC, useState, memo } from 'react';

import Image from 'next/image';

import Player from './Player';
import ProgressTimer from './ProgressTimer';

import { useTranslations } from 'next-intl';
import { IoPause, IoPlay, IoVolumeMediumOutline } from 'react-icons/io5';

import { trpcReact as trpc } from '@/utils/trpc';
import ArtistText from './ArtistText';
import TrackText from './TrackText';
import useInterval from '@/hooks/useInterval';
import { ETime } from '@/utils/constants/times';

interface ISpotifyWidgetProps {}

const SpotifyWidget: FC<ISpotifyWidgetProps> = ({}) => {
  const t = useTranslations('global.footer');

  const { data, isLoading, refetch } = trpc.getNowPlaying.useQuery();

  const [localVolume, setLocalVolume] = useState<number>(0.4);
  const [isLocalPlaying, setIsLocalPlaying] = useState<boolean>(false);

  const togglePlayPause = () => {
    setIsLocalPlaying((prev) => !prev);
  };

  const checkIfPlaying = () => {
    if (data === undefined) return false;
    if ('error' in data) return false;
    if (data.currently_playing_type !== 'track') return false;
    if (data.item.explicit === true) return false;
    return true;
  };

  useInterval(() => {
    if (checkIfPlaying() === false) {
      refetch();
    }
  }, ETime.HALF_MINUTE);

  if (isLoading) {
    return (
      <div className="w-full p-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
      </div>
    );
  }

  if (data === undefined) {
    return <p className="text-red-500 text-center font-bold text-lg my-5 ml-3">{t('spotify.errors.noFetch')}</p>;
  }

  if ('error' in data) {
    const errorMessage = data.error.status === 204 ? t('spotify.errors.noPlaying') : `Error: ${data.error.message}`;

    return (
      <p className={`text-${data.error.status === 204 ? 'white' : 'red-500'} text-center font-bold text-lg my-5 ml-3`}>
        {errorMessage}
      </p>
    );
  }

  if (data.currently_playing_type !== 'track' || data.item.explicit === true) {
    return <p className="text-white text-center font-bold text-lg my-5 ml-3">{t('spotify.errors.noPlaying')}</p>;
  }

  return (
    <article className="bg-gray-900 text-white flex-grow flex rounded flex-col overflow-hidden items-center sm:flex-row">
      <div className="w-3/6 sm:w-2/6 aspect-square mt-5 sm:mt-0 group bg-black rounded-md object-cover bg-cover relative">
        <Image
          src={data.item.album.images.length > 0 ? data.item.album.images[0].url : '/images/spotify.png'}
          alt={data.item.album.name}
          width={300}
          height={300}
        />
        {data.item.preview_url && (
          <div className="group-hover:opacity-100  absolute inset-0 flex flex-col bg-black/50 items-center justify-center opacity-0 transition-opacity">
            <button
              type="button"
              onClick={togglePlayPause}
              className="w-full h-full flex gap-1 justify-center items-center">
              {}
              {isLocalPlaying ? (
                <>
                  <IoPause size={30} />
                  <span className="text-xs text-white">{t('spotify.buttons.pause')}</span>
                </>
              ) : (
                <>
                  <IoPlay size={30} />
                  <span className="text-xs text-white">{t('spotify.buttons.play')}</span>
                </>
              )}
            </button>
            <div className="px-10 absolute bottom-0 inset-x-0 text-white">
              <div className="flex items-center justify-between gap-1 py-3">
                <IoVolumeMediumOutline size={25} />
                <input
                  type="range"
                  value={localVolume}
                  title={t('spotify.buttons.volume')}
                  onChange={(e) => setLocalVolume(Number(e.target.value))}
                  className="w-full h-1 hover:bg-green-600 hover:bg-gradient-to-r hover:from-emerald-700 hover:to-green-500 rounded-lg appearance-none cursor-pointer range-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full sm:w-4/6 flex flex-grow h-full relative">
        <div className="flex flex-col w-full p-5">
          <ArtistText
            artists={data.item.artists.map((artist) => artist.name)}
            url={data.item.artists[0].external_urls.spotify}
          />
          <TrackText track={data.item.name} url={data.item.external_urls.spotify} />

          <Player
            isHidden={!isLocalPlaying}
            audioSrc={data.item.preview_url}
            isPlaying={isLocalPlaying}
            onChange={setIsLocalPlaying}
            volume={localVolume}
          />

          <ProgressTimer
            isHidden={isLocalPlaying}
            progress_ms={data.progress_ms}
            duration_ms={data.item.duration_ms}
            onFinish={refetch}
            isPlaying={data.is_playing}
          />

          {/**<a
            target="_blank"
            rel="noopener noreferrer"
            href={data.item.external_urls.spotify}
            className="hidden  gap-2 mt-2 md:mt-0 p-2 text-xs items-center md:absolute rounded-sm z-40 bg-black/50 top-0 right-0">
            <span className="">Listening on </span>
            <Image
              src="https://res.cloudinary.com/js-media/image/upload/v1691956781/portfolio/win11/Spotify_Logo_RGB_Green_a3ceey.webp"
              alt="Spotify"
              width={55}
              height={40}
            />
          </a> */}
        </div>
      </div>
    </article>
  );
};

export default memo(SpotifyWidget);
