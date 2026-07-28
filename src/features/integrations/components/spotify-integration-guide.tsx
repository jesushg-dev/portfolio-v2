"use client";

import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";

import { api } from "@/trpc/react";
import { Link } from "@/i18n/routing";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SpotifyIntegrationGuide() {
  const t = useTranslations("admin.spotify");
  const redirectQuery = api.spotifyAdmin.getRedirectUri.useQuery();

  return (
    <aside className="flex flex-col gap-4">
      <Alert>
        <AlertDescription>{t("storagePolicy")}</AlertDescription>
      </Alert>

      {redirectQuery.data?.redirectUri && (
        <div className="bg-muted/40 rounded-lg border p-4">
          <p className="text-sm font-medium">{t("redirectUriLabel")}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {t("redirectUriHint")}
          </p>
          <code className="bg-muted mt-2 block rounded-md px-3 py-2 font-mono text-xs break-all">
            {redirectQuery.data.redirectUri}
          </code>
        </div>
      )}

      <div className="bg-muted/40 rounded-lg border p-4">
        <p className="text-sm font-medium">{t("scopesTitle")}</p>
        <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-sm">
          <li>{t("scopes.nowPlaying")}</li>
          <li>{t("scopes.playbackState")}</li>
          <li>{t("scopes.recentlyPlayed")}</li>
        </ul>
      </div>

      <p className="text-muted-foreground text-xs">
        {t.rich("privacyNote", {
          link: (chunks) => (
            <Link
              href="/privacy"
              className="text-primary font-medium underline"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>

      <a
        href="https://developer.spotify.com/dashboard"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
      >
        {t("connect.dashboardLink")}
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    </aside>
  );
}
