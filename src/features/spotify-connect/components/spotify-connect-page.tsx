"use client";

import { useMemo, type FC } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { api } from "@/trpc/react";
import { Link } from "@/i18n/routing";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import SpotifyConnectForm from "./spotify-connect-form";
import SpotifyConnectionStatus from "./spotify-connection-status";

const SpotifyConnectPage: FC = () => {
  const t = useTranslations("admin.spotify");
  const searchParams = useSearchParams();
  const statusQuery = api.spotifyAdmin.getConnectionStatus.useQuery();
  const redirectQuery = api.spotifyAdmin.getRedirectUri.useQuery();

  const callbackMessage = useMemo(() => {
    if (searchParams.get("connected") === "1") {
      return t("callback.connected");
    }

    const error = searchParams.get("error");
    if (!error) return null;

    const errorKey = {
      access_denied: "callback.accessDenied",
      exchange_failed: "callback.exchangeFailed",
      invalid_state: "callback.invalidState",
      missing_params: "callback.missingParams",
      no_refresh_token: "callback.noRefreshToken",
    }[error] as
      | "callback.accessDenied"
      | "callback.exchangeFailed"
      | "callback.invalidState"
      | "callback.missingParams"
      | "callback.noRefreshToken"
      | undefined;

    return errorKey ? t(errorKey) : t("callback.exchangeFailed");
  }, [searchParams, t]);

  if (statusQuery.isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  const connection = statusQuery.data;
  const showConnectForm =
    !connection ||
    connection.status === "disconnected" ||
    connection.status === "refresh_error";

  return (
    <div className="flex w-full flex-col gap-6">
      {callbackMessage && (
        <Alert>
          <AlertDescription>{callbackMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
        <div className="flex flex-col gap-6">
          {connection && connection.status !== "disconnected" && (
            <SpotifyConnectionStatus
              status={connection.status}
              clientId={connection.clientId}
              connectedAt={connection.connectedAt}
            />
          )}

          {showConnectForm && <SpotifyConnectForm />}
        </div>

        <aside className="flex flex-col gap-4">
          <Alert>
            <AlertDescription>{t("storagePolicy")}</AlertDescription>
          </Alert>

          {redirectQuery.data?.redirectUri && (
            <div className="bg-card rounded-xl border p-4">
              <p className="text-sm font-medium">{t("redirectUriLabel")}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {t("redirectUriHint")}
              </p>
              <code className="bg-muted mt-2 block rounded-md px-3 py-2 font-mono text-xs break-all">
                {redirectQuery.data.redirectUri}
              </code>
            </div>
          )}

          <div className="bg-card rounded-xl border p-4">
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
        </aside>
      </div>
    </div>
  );
};

export default SpotifyConnectPage;
