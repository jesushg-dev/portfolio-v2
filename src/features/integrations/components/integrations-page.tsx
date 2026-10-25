"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { KeyRound, ShieldCheck } from "lucide-react";

import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  INTEGRATION_CATALOG,
  type IntegrationCatalogItem,
} from "../lib/integration-catalog";
import { IntegrationCard } from "./integration-card";

export function IntegrationsPage() {
  const t = useTranslations("adminCredentials");
  const [filter, setFilter] = useState<"all" | "connected" | "available">(
    "all",
  );

  const { data: configs, isLoading } =
    api.integrationsAdmin.getConfigs.useQuery();
  const spotifyStatus = api.spotifyAdmin.getConnectionStatus.useQuery();
  const gcalStatus = api.googleCalendarAdmin.getConnectionStatus.useQuery();

  const isSpotifyConnected =
    spotifyStatus.data != null && spotifyStatus.data.status !== "disconnected";
  const isGoogleCalendarConnected =
    gcalStatus.data != null && gcalStatus.data.status !== "disconnected";

  const { connectedCatalog, availableCatalog } = useMemo(() => {
    if (!configs) {
      return { connectedCatalog: [], availableCatalog: [] };
    }

    const isConnected = (id: IntegrationCatalogItem["id"]): boolean => {
      if (id === "spotify") return isSpotifyConnected;
      if (id === "google-calendar") return isGoogleCalendarConnected;
      return configs[id]?.isConfigured ?? false;
    };

    const connected = INTEGRATION_CATALOG.filter((item) =>
      isConnected(item.id),
    );
    const available = INTEGRATION_CATALOG.filter(
      (item) => !isConnected(item.id),
    );

    return { connectedCatalog: connected, availableCatalog: available };
  }, [configs, isSpotifyConnected, isGoogleCalendarConnected]);

  const isLoadingAll =
    isLoading || spotifyStatus.isLoading || gcalStatus.isLoading;

  if (isLoadingAll || !configs) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-10 w-80 rounded-xl" />
          <Skeleton className="h-5 w-full max-w-2xl rounded-lg" />
        </div>
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-11 w-72 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          {INTEGRATION_CATALOG.map((item) => (
            <Skeleton key={item.id} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const showConnectedSection =
    filter !== "available" && connectedCatalog.length > 0;
  const showAvailableSection =
    filter !== "connected" && availableCatalog.length > 0;

  const showEmptyConnected =
    filter === "connected" && connectedCatalog.length === 0;
  const showEmptyAvailable =
    filter === "available" && availableCatalog.length === 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="space-y-3">
        <h1 className="text-foreground flex flex-wrap items-center gap-x-3 gap-y-2 text-2xl font-bold tracking-tight sm:text-4xl">
          <span>{t("title")}</span>
          <span
            id="ratio"
            className="bg-primary/15 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
          >
            <KeyRound className="size-3.5" aria-hidden />
            <span>
              {connectedCatalog.length} / {INTEGRATION_CATALOG.length}
            </span>
          </span>
        </h1>
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed sm:text-base">
          {t("subtitle")}
        </p>

        {/* Security & Privacy Banner */}
        <div className="border-primary/25 bg-primary/10 text-card-foreground flex items-start gap-4 rounded-2xl border p-4 sm:items-center sm:p-5">
          <span className="bg-primary/15 text-primary ring-primary/30 grid size-11 shrink-0 place-items-center rounded-xl ring-1">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <p className="text-foreground/90 min-w-0 text-sm leading-relaxed">
            {t("securityNotice")}{" "}
            <span className="bg-background/60 border-border/80 text-foreground/80 rounded-md border px-1.5 py-0.5 font-mono text-xs font-semibold whitespace-nowrap">
              AES-256
            </span>
          </p>
        </div>
      </header>

      {/* Filter Tabs */}
      <Tabs
        value={filter}
        onValueChange={(val) =>
          setFilter(val as "all" | "connected" | "available")
        }
        className="w-full"
      >
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto"
        >
          <TabsTrigger
            value="all"
            className="gap-2 px-4 py-2.5 text-sm"
          >
            <span>{t("filters.all")}</span>
            <span className="text-muted-foreground text-xs tabular-nums">
              ({INTEGRATION_CATALOG.length})
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="connected"
            className="gap-2 px-4 py-2.5 text-sm"
          >
            <span>{t("filters.connected")}</span>
            <span className="text-muted-foreground text-xs tabular-nums">
              ({connectedCatalog.length})
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="available"
            className="gap-2 px-4 py-2.5 text-sm"
          >
            <span>{t("filters.available")}</span>
            <span className="text-muted-foreground text-xs tabular-nums">
              ({availableCatalog.length})
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Main Grid Content */}
      <div className="space-y-8">
        {showConnectedSection ? (
          <section aria-label={t("connected.title")} className="space-y-4">
            <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
              <span>{t("connected.title")}</span>
              <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
                {connectedCatalog.length}
              </span>
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {connectedCatalog.map((catalogItem) => (
                <IntegrationCard
                  key={catalogItem.id}
                  catalogItem={catalogItem}
                  isConnected={true}
                  configs={configs}
                  spotifyClientId={spotifyStatus.data?.clientId}
                  googleCalendarClientId={gcalStatus.data?.clientId}
                />
              ))}
            </div>
          </section>
        ) : null}

        {showEmptyConnected ? (
          <div className="border-border/80 bg-card/20 rounded-2xl border border-dashed p-10 text-center">
            <div className="text-foreground text-sm font-medium">
              {t("empty.noneConnectedTitle")}
            </div>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              {t("empty.noneConnectedDescription")}
            </p>
          </div>
        ) : null}

        {showAvailableSection ? (
          <section aria-label={t("available.title")} className="space-y-4">
            <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
              <span>{t("available.title")}</span>
              <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
                {availableCatalog.length}
              </span>
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {availableCatalog.map((catalogItem) => (
                <IntegrationCard
                  key={catalogItem.id}
                  catalogItem={catalogItem}
                  isConnected={false}
                  configs={configs}
                />
              ))}
            </div>
          </section>
        ) : null}

        {showEmptyAvailable ? (
          <div className="border-border/80 bg-card/20 rounded-2xl border border-dashed p-10 text-center">
            <div className="text-foreground text-sm font-medium">
              {t("empty.allConnectedTitle")}
            </div>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              {t("empty.allConnectedDescription")}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
