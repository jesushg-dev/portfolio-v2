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
import SpotifyWidgetSkeleton from "@/components/shared/spotify-widget/spotify-widget-skeleton";

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
        className="absolute top-9.5 left-3.5 grid size-7 place-items-center"
      >
        <ChevronDown className="size-5" />
      </button>
      {unavailable ? (
        <p role="status" className="text-sm text-white/75">
          {t("spotify.errors.noPlaying")}
        </p>
      ) : (
        <div role="status" aria-label="Spotify" aria-busy="true">
          <SpotifyWidgetSkeleton />
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
