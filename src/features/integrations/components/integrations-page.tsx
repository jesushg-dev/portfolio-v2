"use client";

import { useTranslations } from "next-intl";

import { api, type RouterOutputs } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";

import { INTEGRATION_CATALOG } from "../lib/integration-catalog";
import { AvailableIntegrationCard } from "./available-integration-card";
import { IntegrationCard } from "./integration-card";
import { SpotifyIntegrationCard } from "./spotify-integration-card";

function isProviderConnected(
  provider: (typeof INTEGRATION_CATALOG)[number]["id"],
  configs: RouterOutputs["integrationsAdmin"]["getConfigs"],
  isSpotifyConnected: boolean,
): boolean {
  if (provider === "spotify") return isSpotifyConnected;
  return configs[provider].isConfigured;
}

export function IntegrationsPage() {
  const t = useTranslations("adminCredentials");
  const { data: configs, isLoading } =
    api.integrationsAdmin.getConfigs.useQuery();
  const spotifyStatus = api.spotifyAdmin.getConnectionStatus.useQuery();

  const isLoadingAll = isLoading || spotifyStatus.isLoading;

  if (isLoadingAll || !configs) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {INTEGRATION_CATALOG.map((item) => (
            <Skeleton key={item.id} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const isSpotifyConnected =
    spotifyStatus.data != null && spotifyStatus.data.status !== "disconnected";

  const connectedCatalog = INTEGRATION_CATALOG.filter((item) =>
    isProviderConnected(item.id, configs, isSpotifyConnected),
  );

  const availableCatalog = INTEGRATION_CATALOG.filter(
    (item) => !isProviderConnected(item.id, configs, isSpotifyConnected),
  );

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground max-w-3xl text-sm">
          {t("subtitle")}
        </p>
      </header>

      {connectedCatalog.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-foreground text-sm font-semibold tracking-wide uppercase">
            {t("connected.title")}
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {connectedCatalog.map((catalogItem) =>
              catalogItem.id === "spotify" ? (
                <SpotifyIntegrationCard key={catalogItem.id} />
              ) : (
                <IntegrationCard
                  key={catalogItem.id}
                  catalogItem={catalogItem}
                  configs={configs}
                />
              ),
            )}
          </div>
        </section>
      ) : (
        <div className="border-border bg-muted/30 rounded-lg border border-dashed p-8 text-center">
          <p className="text-foreground font-medium">{t("empty.title")}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("empty.description")}
          </p>
        </div>
      )}

      {availableCatalog.length > 0 && (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-foreground text-sm font-semibold tracking-wide uppercase">
              {t("available.title")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("available.description")}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {availableCatalog.map((catalogItem) => (
              <AvailableIntegrationCard
                key={catalogItem.id}
                catalogItem={catalogItem}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
