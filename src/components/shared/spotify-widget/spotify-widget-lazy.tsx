"use client";

import dynamic from "next/dynamic";

import SpotifyWidgetSkeleton from "./spotify-widget-skeleton";

const SpotifyWidget = dynamic(
  () => import("@/components/shared/spotify-widget"),
  {
    ssr: false,
    loading: () => <SpotifyWidgetSkeleton />,
  },
);

export default function SpotifyWidgetLazy() {
  return <SpotifyWidget />;
}
