"use client";
import { Music } from "lucide-react";
import { MediaImage } from "@/components/shared/media-image";
import ViewportSection from "@/components/shared/viewport-section";
import { useSpotifyPlayback } from "@/components/shared/spotify-widget/hooks/use-spotify-playback";
import { TRPCReactProvider } from "@/trpc/react";
import { NowHover } from "./now-hover";
interface NowLastPlayedProps {
  headingPlaying: string;
  headingLast: string;
  idleTitle: string;
  idleSubtitle: string;
}
function PlaybackSkeleton() {
  return (
    <div className="flex min-h-24 items-center justify-between gap-5">
      <div className="flex-1 space-y-3">
        <div className="bg-muted h-3 w-20 rounded" />
        <div className="bg-muted h-5 w-full rounded" />
        <div className="bg-muted h-3 w-3/4 rounded" />
      </div>
      <div className="bg-muted size-20 shrink-0 rounded-lg" />
    </div>
  );
}
function NowLastPlayedContent({
  headingPlaying,
  headingLast,
  idleTitle,
  idleSubtitle,
}: NowLastPlayedProps) {
  const { playback, isLoading, isFetchError, error } = useSpotifyPlayback();
  if (isLoading) return <PlaybackSkeleton />;
  const track = isFetchError || error ? null : playback;
  const isLive = track?.source === "now_playing" && track.isPlaying;
  return (
    <div className="flex min-w-0 items-center justify-between gap-5">
      <div className="min-w-0">
        <h3 className="text-muted-foreground text-sm">
          {isLive ? headingPlaying : headingLast}
          {isLive ? (
            <span
              aria-hidden
              className="bg-success ml-2 inline-block size-1.5 rounded-full"
            />
          ) : null}
        </h3>
        <p className="text-foreground mt-2 text-xl leading-tight font-semibold tracking-tight">
          {track ? (
            <a
              href={track.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              {track.title}
            </a>
          ) : (
            idleTitle
          )}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {track ? track.subtitle || track.primaryArtist : idleSubtitle}
        </p>
      </div>
      <NowHover
        cover
        className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-lg shadow-lg"
      >
        {track?.imageUrl ? (
          <MediaImage
            src={track.imageUrl}
            alt={track.imageAlt}
            fill
            sizes="5rem"
            className="object-cover"
          />
        ) : (
          <span className="text-primary flex size-full items-center justify-center">
            <Music aria-hidden className="size-6" />
          </span>
        )}
      </NowHover>
    </div>
  );
}
export function NowLastPlayed(props: NowLastPlayedProps) {
  return (
    <ViewportSection
      fallback={<PlaybackSkeleton />}
      minHeight="6rem"
      requiresInteraction
    >
      <TRPCReactProvider>
        <NowLastPlayedContent {...props} />
      </TRPCReactProvider>
    </ViewportSection>
  );
}
