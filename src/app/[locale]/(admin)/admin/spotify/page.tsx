export { generateMetadata } from "./metadata";
import type { FC } from "react";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import type { Locale } from "@/i18n/config";
import { getPathname } from "@/i18n/routing";

interface ISpotifyAdminPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Legacy route — redirects to the Spotify integration modal. */
const SpotifyAdminPage: FC<ISpotifyAdminPageProps> = async ({
  params,
  searchParams,
}) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const sp = await searchParams;
  const query = new URLSearchParams();

  if (sp.connected === "1") {
    query.set("spotify_connected", "1");
  }

  const error = sp.error;
  if (typeof error === "string") {
    query.set("spotify_error", error);
  }

  const spotifyPath = getPathname({
    locale: locale as Locale,
    href: {
      pathname: "/admin/credentials/[provider]",
      params: { provider: "spotify" },
    },
  });

  const qs = query.toString();
  redirect(qs ? `${spotifyPath}?${qs}` : spotifyPath);
};

export default SpotifyAdminPage;
