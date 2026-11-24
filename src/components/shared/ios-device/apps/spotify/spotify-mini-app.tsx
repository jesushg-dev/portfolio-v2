"use client";

import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { IOSDynamicIsland } from "@/components/shared/ios-device";
import { TRPCReactProvider } from "@/trpc/react";
import { SpotifyPlaybackProvider } from "@/components/shared/spotify-widget/context/spotify-playback-context";
import { SpotifyDeviceScreens } from "./spotify-device-screens";
import { useAlbumPalette } from "@/components/shared/spotify-widget/hooks/use-album-color";
import { useDragToClose } from "@/components/shared/spotify-widget/hooks/use-drag-to-close";
import { useSpotifyPlayback } from "@/components/shared/spotify-widget/hooks/use-spotify-playback";

export function SpotifyMiniAppStatus({
  onClose,
  unavailable = false,
}: {
  onClose: () => void;
  unavailable?: boolean;
}) {
  const t = useTranslations("global.footer");
  return (
    <div className="flex size-full flex-col justify-center gap-3 px-4 text-center text-white">
      <button
        type="button"
        onClick={onClose}
        aria-label={t("spotify.fullscreen.close")}
        className="absolute top-9.5 left-3.5 grid size-7 place-items-center text-white/80 transition-colors hover:text-white"
      >
        <ChevronDown className="size-5" />
      </button>
      {unavailable ? (
        <p role="status" className="text-sm text-white/75">
          {t("spotify.errors.noPlaying")}
        </p>
      ) : (
        <div
          role="status"
          aria-label="Spotify"
          aria-busy="true"
          className="flex flex-col items-center justify-center gap-5 px-6"
        >
          {/* iOS Now Playing album art skeleton */}
          <div className="size-48 animate-pulse rounded-2xl bg-white/10 shadow-2xl sm:size-52" />
          <div className="w-full max-w-[15rem] space-y-2 pt-2 text-center">
            <div className="mx-auto h-4 w-4/5 animate-pulse rounded-full bg-white/15" />
            <div className="mx-auto h-3 w-1/2 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="w-full max-w-[15rem] space-y-1.5 pt-3">
            <div className="h-1 w-full rounded-full bg-white/10" />
            <div className="flex justify-between text-[0.6875rem] text-white/40 tabular-nums">
              <span>0:00</span>
              <span>-:--</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SpotifyMiniAppContent({ onClose }: { onClose: () => void }) {
  const locale = useLocale();
  const { y, dragProps } = useDragToClose(onClose, true);
  const {
    playback,
    error,
    isFetchError,
    isLoading,
    nextTrackLyrics,
    nextTrackPlayback,
    onTrackEndReached,
  } = useSpotifyPlayback();
  const { vibrant: accentColor } = useAlbumPalette(playback?.imageUrl);

  if (isLoading || error || isFetchError || !playback) {
    return <SpotifyMiniAppStatus onClose={onClose} unavailable={!isLoading} />;
  }

  return (
    <SpotifyPlaybackProvider
      playback={playback}
      nextTrackLyrics={nextTrackLyrics}
      nextTrackPlayback={nextTrackPlayback}
      onTrackEndReached={onTrackEndReached}
    >
      <SpotifyDeviceScreens
        accentColor={accentColor}
        locale={locale}
        flyComplete
        dragY={y}
        dragProps={dragProps}
        onClose={onClose}
      />
    </SpotifyPlaybackProvider>
  );
}

export default function SpotifyMiniApp({ onClose }: { onClose: () => void }) {
  return (
    <TRPCReactProvider>
      <IOSDynamicIsland overrideState="compact" />
      <SpotifyMiniAppContent onClose={onClose} />
    </TRPCReactProvider>
  );
}
