"use client";

import Image from "next/image";
import { Music } from "lucide-react";

import ViewportSection from "@/components/shared/viewport-section";
import { useSpotifyPlayback } from "@/components/shared/spotify-widget/hooks/use-spotify-playback";

interface NowLastPlayedProps {
  headingPlaying: string;
  headingLast: string;
  idleTitle: string;
  idleSubtitle: string;
}

function NowLastPlayedContent({
  headingPlaying,
  headingLast,
  idleTitle,
  idleSubtitle,
}: NowLastPlayedProps) {
  const { playback, isLoading, isFetchError, error } = useSpotifyPlayback();

  if (isLoading) {
    return (
      <div>
        <div className="bg-muted mb-3 h-3 w-24 animate-pulse rounded" />
        <div className="flex items-center gap-3.5">
          <div className="bg-muted size-12 shrink-0 animate-pulse rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="bg-muted h-3.5 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (isFetchError || error || !playback) {
    return (
      <div>
        <h3 className="text-muted-foreground mb-3 text-xs font-bold tracking-wide uppercase">
          {headingLast}
        </h3>
        <div className="flex items-center gap-3.5">
          <div className="from-primary to-primary/80 flex size-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white">
            <Music aria-hidden className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-foreground truncate text-sm font-bold">
              {idleTitle}
            </div>
            <div className="text-muted-foreground truncate text-xs">
              {idleSubtitle}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isLive = playback.source === "now_playing" && playback.isPlaying;
  const heading = isLive ? headingPlaying : headingLast;

  return (
    <div>
      <h3 className="text-muted-foreground mb-3 text-xs font-bold tracking-wide uppercase">
        {heading}
        {isLive ? (
          <span className="bg-primary ml-2 inline-block size-1.5 animate-pulse rounded-full align-middle" />
        ) : null}
      </h3>
      <a
        href={playback.contentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3.5"
      >
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
          {playback.imageUrl ? (
            <Image
              src={playback.imageUrl}
              alt={playback.imageAlt}
              fill
              sizes="48px"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="from-primary to-primary/80 flex size-full items-center justify-center bg-linear-to-br text-white">
              <Music aria-hidden className="size-5" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-foreground group-hover:text-primary truncate text-sm font-bold transition-colors">
            {playback.title}
          </div>
          <div className="text-muted-foreground truncate text-xs">
            {playback.subtitle || playback.primaryArtist}
          </div>
        </div>
      </a>
    </div>
  );
}

export function NowLastPlayed(props: NowLastPlayedProps) {
  return (
    <ViewportSection
      fallback={
        <div>
          <div className="bg-muted mb-3 h-3 w-24 animate-pulse rounded" />
          <div className="flex items-center gap-3.5">
            <div className="bg-muted size-12 shrink-0 animate-pulse rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="bg-muted h-3.5 w-3/4 animate-pulse rounded" />
              <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
            </div>
          </div>
        </div>
      }
      minHeight="4.5rem"
      rootMargin="120px 0px"
      requiresTrpc
    >
      <NowLastPlayedContent {...props} />
    </ViewportSection>
  );
}
