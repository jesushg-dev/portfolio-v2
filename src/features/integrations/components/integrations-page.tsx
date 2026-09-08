"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";

import { api, type RouterOutputs } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { INTEGRATION_CATALOG } from "../lib/integration-catalog";
import { AvailableIntegrationCard } from "./available-integration-card";
import { GoogleCalendarIntegrationCard } from "./google-calendar-integration-card";
import { IntegrationCard } from "./integration-card";
import { SpotifyIntegrationCard } from "./spotify-integration-card";

type CatalogId = (typeof INTEGRATION_CATALOG)[number]["id"];
type Configs = RouterOutputs["integrationsAdmin"]["getConfigs"];

function isProviderConnected(
  provider: CatalogId,
  configs: Configs,
  isSpotifyConnected: boolean,
  isGoogleCalendarConnected: boolean,
): boolean {
  if (provider === "spotify") return isSpotifyConnected;
  if (provider === "google-calendar") return isGoogleCalendarConnected;
  return configs[provider].isConfigured;
}

export function IntegrationsPage() {
  const t = useTranslations("adminCredentials");
  const [filter, setFilter] = useState<"all" | "connected" | "available">(
    "all",
  );

  const { data: configs, isLoading } =
    api.integrationsAdmin.getConfigs.useQuery();
  const spotifyStatus = api.spotifyAdmin.getConnectionStatus.useQuery();
  const gcalStatus = api.googleCalendarAdmin.getConnectionStatus.useQuery();

  const isLoadingAll =
    isLoading || spotifyStatus.isLoading || gcalStatus.isLoading;

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
  const isGoogleCalendarConnected =
    gcalStatus.data != null && gcalStatus.data.status !== "disconnected";

  const connectedCatalog = INTEGRATION_CATALOG.filter((item) =>
    isProviderConnected(
      item.id,
      configs,
      isSpotifyConnected,
      isGoogleCalendarConnected,
    ),
  );

  const availableCatalog = INTEGRATION_CATALOG.filter(
    (item) =>
      !isProviderConnected(
        item.id,
        configs,
        isSpotifyConnected,
        isGoogleCalendarConnected,
      ),
  );

  const renderConnectedCard = (
    catalogItem: (typeof INTEGRATION_CATALOG)[number],
  ) => {
    if (catalogItem.id === "spotify") {
      return <SpotifyIntegrationCard key={catalogItem.id} />;
    }
    if (catalogItem.id === "google-calendar") {
      return <GoogleCalendarIntegrationCard key={catalogItem.id} />;
    }
    if (
      catalogItem.id === "resend" ||
      catalogItem.id === "uploadthing" ||
      catalogItem.id === "ai"
    ) {
      return (
        <IntegrationCard
          key={catalogItem.id}
          catalogItem={catalogItem}
          configs={configs}
        />
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                {t("title")}
              </h1>
              <Badge variant="secondary" className="gap-1 text-xs">
                <KeyRound className="text-primary size-3" aria-hidden />
                {connectedCatalog.length} / {INTEGRATION_CATALOG.length}
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-3xl text-sm">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Security & Privacy Banner */}
        <div className="bg-card/70 border-border/80 flex items-center gap-3 rounded-xl border p-3.5 shadow-2xs">
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <ShieldCheck className="size-4" aria-hidden />
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
            {t("securityNotice")}
          </p>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b pb-3">
        <Tabs
          value={filter}
          onValueChange={(val) =>
            setFilter(val as "all" | "connected" | "available")
          }
          className="w-full sm:w-auto"
        >
          <TabsList className="bg-muted/70 inline-flex h-9 p-1">
            <TabsTrigger
              value="all"
              className="gap-1.5 px-3 text-xs sm:text-sm"
            >
              <span>{t("filters.all")}</span>
              <Badge
                variant="secondary"
                className="ml-1 px-1.5 py-0 text-[0.625rem]"
              >
                {INTEGRATION_CATALOG.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="connected"
              className="gap-1.5 px-3 text-xs sm:text-sm"
            >
              <span>{t("filters.connected")}</span>
              <Badge
                variant="outline"
                className="ml-1 border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0 text-[0.625rem] text-emerald-600"
              >
                {connectedCatalog.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="available"
              className="gap-1.5 px-3 text-xs sm:text-sm"
            >
              <span>{t("filters.available")}</span>
              <Badge
                variant="outline"
                className="ml-1 px-1.5 py-0 text-[0.625rem]"
              >
                {availableCatalog.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Grid Content */}
      {(filter === "all" || filter === "connected") && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-foreground text-xs font-semibold tracking-wider uppercase">
              {t("connected.title")}
            </h2>
            <Badge variant="secondary" className="text-xs">
              {connectedCatalog.length}
            </Badge>
          </div>

          {connectedCatalog.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {connectedCatalog.map(renderConnectedCard)}
            </div>
          ) : (
            <div className="border-border bg-muted/20 flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
              <div className="bg-muted mb-2 flex size-10 items-center justify-center rounded-lg">
                <Lock className="text-muted-foreground size-5" aria-hidden />
              </div>
              <p className="text-foreground text-sm font-medium">
                {t("empty.title")}
              </p>
              <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                {t("empty.description")}
              </p>
            </div>
          )}
        </section>
      )}

      {(filter === "all" || filter === "available") &&
        availableCatalog.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-foreground text-xs font-semibold tracking-wider uppercase">
                {t("available.title")}
              </h2>
              <Badge variant="outline" className="text-xs">
                {availableCatalog.length}
              </Badge>
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
