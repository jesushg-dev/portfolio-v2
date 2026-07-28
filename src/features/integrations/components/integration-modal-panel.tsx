"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

import { api } from "@/trpc/react";
import type { IntegrationProvider } from "@/lib/integrations/tenant-integrations-service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import SpotifyConnectForm from "@/features/spotify-connect/components/spotify-connect-form";
import SpotifyConnectionStatus from "@/features/spotify-connect/components/spotify-connection-status";

import { ResendIntegrationForm } from "./resend-integration-form";
import { UploadThingIntegrationForm } from "./uploadthing-integration-form";
import { AiIntegrationForm } from "./ai-integration-form";
import { SpotifyIntegrationGuide } from "./spotify-integration-guide";

interface IntegrationModalPanelProps {
  provider: IntegrationProvider;
}

function SpotifyCallbackAlert() {
  const t = useTranslations("adminCredentials");
  const searchParams = useSearchParams();

  const message = useMemo(() => {
    if (searchParams.get("spotify_connected") === "1") {
      return t("spotifyCallback.connected");
    }

    const error = searchParams.get("spotify_error");
    if (!error) return null;

    const errorKey = {
      access_denied: "accessDenied",
      exchange_failed: "exchangeFailed",
      invalid_state: "invalidState",
      missing_params: "missingParams",
      no_refresh_token: "noRefreshToken",
    }[error] as
      | "accessDenied"
      | "exchangeFailed"
      | "invalidState"
      | "missingParams"
      | "noRefreshToken"
      | undefined;

    return errorKey
      ? t(`spotifyCallback.${errorKey}`)
      : t("spotifyCallback.exchangeFailed");
  }, [searchParams, t]);

  if (!message) return null;

  return (
    <Alert>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function SpotifyModalContent() {
  const statusQuery = api.spotifyAdmin.getConnectionStatus.useQuery();

  if (statusQuery.isLoading) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }

  const connection = statusQuery.data;
  const isConnected =
    connection != null && connection.status !== "disconnected";
  const showConnectForm =
    !connection ||
    connection.status === "disconnected" ||
    connection.status === "refresh_error";

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <SpotifyCallbackAlert />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] lg:items-start">
        <div className="flex flex-col gap-6">
          {isConnected && connection && (
            <SpotifyConnectionStatus
              embedded
              status={connection.status}
              clientId={connection.clientId}
              connectedAt={connection.connectedAt}
            />
          )}

          {showConnectForm && <SpotifyConnectForm embedded />}
        </div>

        {showConnectForm && <SpotifyIntegrationGuide />}
      </div>
    </div>
  );
}

function TenantIntegrationModalContent({
  provider,
  onClose,
}: {
  provider: Exclude<IntegrationProvider, "spotify">;
  onClose: () => void;
}) {
  const { data: configs, isLoading } =
    api.integrationsAdmin.getConfigs.useQuery();

  if (isLoading || !configs) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }

  switch (provider) {
    case "resend":
      return (
        <ResendIntegrationForm
          status={configs.resend}
          onSuccess={onClose}
          onCancel={onClose}
        />
      );
    case "uploadthing":
      return (
        <UploadThingIntegrationForm
          status={configs.uploadthing}
          onSuccess={onClose}
          onCancel={onClose}
        />
      );
    case "ai":
      return (
        <AiIntegrationForm
          status={configs.ai}
          onSuccess={onClose}
          onCancel={onClose}
        />
      );
    default:
      return null;
  }
}

export function IntegrationModalPanel({
  provider,
}: IntegrationModalPanelProps) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  if (provider === "spotify") {
    return <SpotifyModalContent />;
  }

  return (
    <TenantIntegrationModalContent provider={provider} onClose={handleClose} />
  );
}
