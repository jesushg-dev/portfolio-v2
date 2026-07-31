"use client";

import ViewportSection from "@/components/shared/viewport-section";
import SpotifyWidgetLazy from "@/components/shared/spotify-widget/spotify-widget-lazy";
import SpotifyWidgetSkeleton from "@/components/shared/spotify-widget/spotify-widget-skeleton";

export default function FooterSpotifySection() {
  return (
    <ViewportSection
      fallback={<SpotifyWidgetSkeleton />}
      minHeight="7.5rem"
      rootMargin="120px 0px"
      requiresTrpc
    >
      <SpotifyWidgetLazy />
    </ViewportSection>
  );
}
