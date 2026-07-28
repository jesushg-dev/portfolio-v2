"use client";

import { useCallback, useState, useTransition, type FC } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertTriangle, Music2, Loader2 } from "lucide-react";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  isActiveTrackPlayback,
  isTrack,
} from "@/components/shared/spotify-widget/playback-mappers";

type ConnectionStatus = "connected" | "refresh_error";

interface SpotifyConnectionStatusProps {
  status: ConnectionStatus;
  clientId: string | null;
  connectedAt: Date | null;
  embedded?: boolean;
}

const SpotifyConnectionStatus: FC<SpotifyConnectionStatusProps> = ({
  status,
  clientId,
  connectedAt,
  embedded = false,
}) => {
  const t = useTranslations("admin.spotify");
  const utils = api.useUtils();
  const [isPending, startTransition] = useTransition();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const disconnect = api.spotifyAdmin.disconnect.useMutation();
  const testNowPlaying = api.spotifyAdmin.testNowPlaying.useQuery(undefined, {
    enabled: false,
  });

  const statusLabel =
    status === "refresh_error"
      ? t("status.refreshError")
      : t("status.connected");

  const handleTest = useCallback(() => {
    startTransition(async () => {
      setActionError(null);
      setTestResult(null);
      try {
        const data = await testNowPlaying.refetch();
        const payload = data.data;

        if (!payload || ("error" in payload && payload.error.status === 204)) {
          setTestResult(t("status.testEmpty"));
          return;
        }

        if ("error" in payload) {
          setTestResult(t("status.testEmpty"));
          return;
        }

        const nowPlaying = payload;
        if (
          isActiveTrackPlayback(nowPlaying) &&
          nowPlaying.item &&
          isTrack(nowPlaying.item)
        ) {
          const track = nowPlaying.item;
          setTestResult(
            t("status.testTrack", {
              title: track.name,
              artist: track.artists[0]?.name ?? "",
            }),
          );
          await utils.spotifyAdmin.getConnectionStatus.invalidate();
          return;
        }

        setTestResult(t("status.testEmpty"));
        await utils.spotifyAdmin.getConnectionStatus.invalidate();
      } catch {
        setActionError(t("actions.connectFailed"));
      }
    });
  }, [testNowPlaying, utils, t]);

  const handleDisconnect = useCallback(() => {
    startTransition(async () => {
      setActionError(null);
      try {
        await disconnect.mutateAsync();
        await utils.spotifyAdmin.getConnectionStatus.invalidate();
        setTestResult(null);
      } catch {
        setActionError(t("actions.disconnectFailed"));
      }
    });
  }, [disconnect, utils, t]);

  const body = (
    <>
      {clientId ? (
        <p className="text-muted-foreground text-sm">
          {t("status.clientId", { id: clientId })}
        </p>
      ) : null}

      {!embedded && (
        <Alert>
          <AlertDescription>{t("disconnectPolicy")}</AlertDescription>
        </Alert>
      )}

      {actionError && (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <div className="bg-muted/40 flex flex-col gap-3 rounded-lg border p-3">
        {testResult ? (
          <div className="flex items-center gap-2 text-sm">
            <Music2 className="text-primary size-4 shrink-0" aria-hidden />
            <span>{testResult}</span>
          </div>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleTest}
          disabled={isPending || testNowPlaying.isFetching}
        >
          {(isPending || testNowPlaying.isFetching) && (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
          )}
          {isPending || testNowPlaying.isFetching
            ? t("status.testing")
            : t("status.test")}
        </Button>
      </div>

      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={handleDisconnect}
        disabled={isPending || disconnect.isPending}
      >
        {disconnect.isPending
          ? t("status.disconnecting")
          : t("status.disconnect")}
      </Button>
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {status === "refresh_error" ? (
            <AlertTriangle className="text-destructive size-5" aria-hidden />
          ) : (
            <CheckCircle2 className="text-primary size-5" aria-hidden />
          )}
          <div>
            <p className="text-sm font-semibold">{statusLabel}</p>
            {connectedAt && (
              <p className="text-muted-foreground text-xs">
                {t("status.connectedAt", {
                  date: connectedAt.toLocaleDateString(),
                })}
              </p>
            )}
          </div>
        </div>
        {body}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === "refresh_error" ? (
            <AlertTriangle className="text-destructive size-5" aria-hidden />
          ) : (
            <CheckCircle2 className="text-primary size-5" aria-hidden />
          )}
          {statusLabel}
        </CardTitle>
        {connectedAt && (
          <CardDescription>
            {t("status.connectedAt", {
              date: connectedAt.toLocaleDateString(),
            })}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{body}</CardContent>
    </Card>
  );
};

export default SpotifyConnectionStatus;
