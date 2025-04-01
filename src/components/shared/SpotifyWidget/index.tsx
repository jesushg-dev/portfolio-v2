"use client";

import type { FC } from "react";
import React, { useState, useMemo, memo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { IoPause, IoPlay, IoVolumeMediumOutline } from "react-icons/io5";

import { api } from "@/trpc/react";
import useInterval from "@/hooks/use-interval";
import { ETime } from "@/utils/constants/times";

import ArtistText from "./ArtistText";
import TrackText from "./TrackText";
import ProgressTimer from "./ProgressTimer";
import Player from "./Player";

const SpotifyWidget: FC = () => {
  const t = useTranslations("global.footer");

  const { data, isLoading, refetch } = api.spotify.getNowPlaying.useQuery();
  const artists = useMemo(
    () =>
      data === undefined || "error" in data
        ? []
        : data.item.artists.map((artist) => artist.name),
    [data],
  );

  const [localVolume, setLocalVolume] = useState<number>(10);
  const [isLocalPlaying, setIsLocalPlaying] = useState<boolean>(false);

  const togglePlayPause = () => {
    setIsLocalPlaying((prev) => !prev);
  };

  const checkIfPlaying = () => {
    if (data === undefined) return false;
    if ("error" in data) return false;
    if (data.currently_playing_type !== "track") return false;
    if (data.item.explicit === true) return false;
    return true;
  };

  useInterval(() => {
    if (checkIfPlaying() === false) {
      void refetch();
    }
  }, ETime.HALF_MINUTE);

  if (isLoading) {
    return (
      <div className="w-full p-4 text-center">
        <div className="border-primary-900 h-8 w-8 animate-spin rounded-full border-b-2" />
      </div>
    );
  }

  if (data === undefined) {
    return (
      <p className="my-5 ml-3 text-center text-lg font-bold text-red-500">
        {t("spotify.errors.noFetch")}
      </p>
    );
  }

  if ("error" in data) {
    const errorMessage =
      data.error.status === 204
        ? t("spotify.errors.noPlaying")
        : `Error: ${data.error.message}`;

    return (
      <p
        className={`text-${
          data.error.status === 204 ? "white" : "red-500"
        } my-5 ml-3 text-center text-lg font-bold`}
      >
        {errorMessage}
      </p>
    );
  }

  if (data.currently_playing_type !== "track" || data.item.explicit === true) {
    return (
      <p className="my-5 ml-3 text-center text-lg font-bold text-white">
        {t("spotify.errors.noPlaying")}
      </p>
    );
  }

  return (
    <article className="flex grow flex-col items-center overflow-hidden rounded-sm bg-gray-900 text-white sm:flex-row">
      <div className="group relative mt-5 aspect-square w-3/6 rounded-md bg-black bg-cover object-cover sm:mt-0 sm:w-2/6">
        <Image
          src={
            data.item.album.images.length > 0
              ? data.item.album.images[0].url
              : "/images/spotify.png"
          }
          alt={data.item.album.name}
          width={300}
          height={300}
        />
        {data.item.preview_url && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={togglePlayPause}
              className="flex h-full w-full items-center justify-center gap-1"
            >
              {}
              {isLocalPlaying ? (
                <>
                  <IoPause size={30} />
                  <span className="text-xs text-white">
                    {t("spotify.buttons.pause")}
                  </span>
                </>
              ) : (
                <>
                  <IoPlay size={30} />
                  <span className="text-xs text-white">
                    {t("spotify.buttons.play")}
                  </span>
                </>
              )}
            </button>
            <div className="absolute inset-x-0 bottom-0 px-10 text-white">
              <div className="flex items-center justify-between gap-1 py-3">
                <IoVolumeMediumOutline size={25} />
                <input
                  type="range"
                  value={localVolume}
                  title={t("spotify.buttons.volume")}
                  onChange={(e) => setLocalVolume(Number(e.target.value))}
                  className="range-sm h-1 w-full cursor-pointer appearance-none rounded-lg hover:bg-green-600 hover:bg-linear-to-r hover:from-emerald-700 hover:to-green-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative flex h-full w-full grow sm:w-4/6">
        <div className="flex w-full flex-col p-5">
          <ArtistText
            artists={artists}
            url={data.item.artists[0].external_urls.spotify}
          />
          <TrackText
            track={data.item.name}
            url={data.item.external_urls.spotify}
          />

          <Player
            isHidden={!isLocalPlaying}
            audioSrc={data.item.preview_url}
            isLocalPlaying={isLocalPlaying}
            onChange={setIsLocalPlaying}
            volume={localVolume}
          />

          <ProgressTimer
            isHidden={isLocalPlaying}
            progressMs={data.progress_ms}
            durationMs={data.item.duration_ms}
            onFinish={refetch}
            isPlaying={data.is_playing}
          />

          {/** <a
            target="_blank"
            rel="noopener noreferrer"
            href={data.item.external_urls.spotify}
            className="hidden  gap-2 mt-2 md:mt-0 p-2 text-xs items-center md:absolute rounded-xs z-40 bg-black/50 top-0 right-0">
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
