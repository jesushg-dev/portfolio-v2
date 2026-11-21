"use client";

import { IOSNavigationStack, IOSScreen } from "@/components/shared/ios-device";
import SpotifyNowPlayingScreen from "./spotify-now-playing-screen";
import SpotifyLyricsScreen from "./spotify-lyrics-screen";
import type {
  SpotifyDragMotionValue,
  SpotifyDragToCloseProps,
} from "@/components/shared/spotify-widget/hooks/use-drag-to-close";

interface SpotifyDeviceScreensProps {
  accentColor: string;
  locale: string;
  flyComplete: boolean;
  dragY: SpotifyDragMotionValue;
  dragProps: SpotifyDragToCloseProps;
  onClose: () => void;
}

export function SpotifyDeviceScreens(props: SpotifyDeviceScreensProps) {
  return (
    <IOSNavigationStack initialRoute="now-playing">
      <IOSScreen id="now-playing">
        <SpotifyNowPlayingScreen {...props} />
      </IOSScreen>
      <IOSScreen id="lyrics" presentation="sheet">
        <SpotifyLyricsScreen accentColor={props.accentColor} />
      </IOSScreen>
    </IOSNavigationStack>
  );
}
