"use client";

import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { api, type RouterOutputs } from "@/trpc/react";
import { Link } from "@/i18n/routing";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { IntegrationCatalogItem } from "../lib/integration-catalog";

type IntegrationConfigs = RouterOutputs["integrationsAdmin"]["getConfigs"];

export interface IntegrationCardProps {
  catalogItem: IntegrationCatalogItem;
  isConnected: boolean;
  configs?: IntegrationConfigs;
  spotifyClientId?: string | null;
  googleCalendarClientId?: string | null;
}

export function IntegrationCard({
  catalogItem,
  isConnected,
  configs,
  spotifyClientId,
  googleCalendarClientId,
}: IntegrationCardProps) {
  const t = useTranslations("adminCredentials");
  const utils = api.useUtils();
  const [isPending, startTransition] = useTransition();
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

  const deleteIntegration =
    api.integrationsAdmin.deleteIntegration.useMutation();
  const disconnectSpotify = api.spotifyAdmin.disconnect.useMutation();
  const disconnectGCal = api.googleCalendarAdmin.disconnect.useMutation();
  const syncTemplates = api.integrationsAdmin.syncResendTemplates.useMutation();

  const { id: provider, icon: Icon, accentClass, category } = catalogItem;

  const handleSyncTemplates = useCallback(() => {
    startTransition(async () => {
      try {
        const res = await syncTemplates.mutateAsync();
        await utils.integrationsAdmin.getConfigs.invalidate();
        toast.success(
          t("resend.syncSuccess") + ` (${res.syncedCount} templates)`,
        );
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to sync templates",
        );
      }
    });
  }, [syncTemplates, utils, t]);

  const handleConfirmDisconnect = useCallback(() => {
    startTransition(async () => {
      try {
        if (provider === "spotify") {
          await disconnectSpotify.mutateAsync();
          await utils.spotifyAdmin.getConnectionStatus.invalidate();
        } else if (provider === "google-calendar") {
          await disconnectGCal.mutateAsync();
          await utils.googleCalendarAdmin.getConnectionStatus.invalidate();
        } else {
          await deleteIntegration.mutateAsync({
            provider: provider,
          });
          await utils.integrationsAdmin.getConfigs.invalidate();
        }
        setDisconnectDialogOpen(false);
        toast.success(t("actions.disconnectSuccess"));
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("actions.disconnectFailed"),
        );
      }
    });
  }, [
    deleteIntegration,
    disconnectGCal,
    disconnectSpotify,
    provider,
    utils,
    t,
  ]);

  const providerName = t(`providers.${provider}.name`);
  const categoryLabel = t(`categories.${category}`);

  return (
    <article
      data-integration={provider}
      data-connected={isConnected ? "true" : "false"}
      className="border-border/80 bg-card/40 text-card-foreground hover:border-border flex min-w-0 flex-col justify-between rounded-2xl border p-5 shadow-sm backdrop-blur transition-all duration-200 hover:shadow-md sm:p-6"
    >
      <div>
        <div className="flex items-start gap-3.5">
          <span
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-xl border ring-1 transition-transform group-hover:scale-105",
              accentClass,
            )}
          >
            <Icon className="size-5.5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground text-base leading-snug font-semibold break-words">
              {providerName}
            </h3>
            <div className="text-muted-foreground text-xs font-medium">
              {categoryLabel}
            </div>
            {isConnected ? (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
                <span
                  className="size-1.5 rounded-full bg-emerald-500"
                  aria-hidden
                />
                <span>{t("status.configured")}</span>
              </span>
            ) : (
              <span className="border-border/80 bg-muted/30 text-muted-foreground mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                <span>{t("status.notConfigured")}</span>
              </span>
            )}
          </div>
        </div>

        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
          {t(`providers.${provider}.description`)}
        </p>

        <div className="border-border/60 bg-muted/25 mt-4 rounded-xl border p-3.5 text-sm">
          {isConnected ? (
            <ConnectedInfoBox
              provider={provider}
              configs={configs}
              spotifyClientId={spotifyClientId}
              googleCalendarClientId={googleCalendarClientId}
              t={t}
            />
          ) : (
            <div className="text-muted-foreground text-xs font-medium sm:text-sm">
              {t("status.notConnected")}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3 pt-2">
        <div className="bg-muted/40 border-border/40 text-muted-foreground rounded-lg border px-3 py-2 text-xs font-medium">
          {t(`tags.${provider}`)}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isConnected ? (
            <>
              {provider === "resend" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSyncTemplates}
                  disabled={isPending}
                  className="min-h-11 w-full gap-1.5 text-xs font-medium sm:min-h-9 sm:w-auto"
                >
                  <RefreshCw
                    className={cn("size-3.5", isPending && "animate-spin")}
                    aria-hidden
                  />
                  <span>{t("resend.syncButton")}</span>
                </Button>
              )}
              <Link
                href={{
                  pathname: "/admin/credentials/[provider]",
                  params: { provider },
                }}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className:
                    "min-h-11 w-full text-xs font-medium sm:min-h-9 sm:w-auto",
                })}
              >
                <span>{t("actions.manage")}</span>
              </Link>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setDisconnectDialogOpen(true)}
                disabled={isPending}
                className="min-h-11 w-full text-xs font-medium sm:min-h-9 sm:w-auto"
              >
                <span>{t("actions.disconnect")}</span>
              </Button>
            </>
          ) : (
            <Link
              href={{
                pathname: "/admin/credentials/[provider]",
                params: { provider },
              }}
              className={buttonVariants({
                variant: "default",
                size: "sm",
                className:
                  "inline-flex min-h-11 w-full items-center justify-center gap-2 font-semibold shadow-sm sm:min-h-9 sm:w-auto",
              })}
            >
              <span>{t("actions.connect")}</span>
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>
      </div>

      <Dialog
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("actions.disconnectConfirmTitle", { provider: providerName })}
            </DialogTitle>
            <DialogDescription>
              {t("actions.disconnectConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDisconnectDialogOpen(false)}
              disabled={isPending}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDisconnect}
              disabled={isPending}
            >
              {isPending ? t("actions.disconnecting") : t("actions.disconnect")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}

function ConnectedInfoBox({
  configs,
  googleCalendarClientId,
  provider,
  spotifyClientId,
  t,
}: {
  configs?: IntegrationConfigs;
  googleCalendarClientId?: string | null;
  provider: IntegrationCatalogItem["id"];
  spotifyClientId?: string | null;
  t: ReturnType<typeof useTranslations<"adminCredentials">>;
}) {
  switch (provider) {
    case "resend": {
      const status = configs?.resend;
      const rows: [string, string][] = [];
      if (status?.emailDomain) {
        rows.push([t("summary.domain"), status.emailDomain]);
      }
      if (status?.syncedTemplatesCount && status.syncedTemplatesCount > 0) {
        rows.push([
          t("status.syncedCount", { count: status.syncedTemplatesCount }),
          "",
        ]);
      }

      if (rows.length === 0) {
        return (
          <div className="text-foreground flex items-center gap-2 text-xs sm:text-sm">
            <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
            <span>{t("summary.tokenSaved")}</span>
          </div>
        );
      }

      return (
        <dl className="space-y-1.5">
          {rows.map(([label, val]) => (
            <div
              key={label}
              className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs sm:text-sm"
            >
              <dt className="text-muted-foreground">{label}</dt>
              {val ? (
                <dd className="text-foreground font-medium">{val}</dd>
              ) : null}
            </div>
          ))}
        </dl>
      );
    }

    case "uploadthing": {
      const appId = configs?.uploadthing?.appId;
      if (appId) {
        return (
          <dl className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs sm:text-sm">
              <dt className="text-muted-foreground">{t("summary.appId")}</dt>
              <dd className="text-foreground font-medium">{appId}</dd>
            </div>
          </dl>
        );
      }
      return (
        <div className="text-foreground flex items-center gap-2 text-xs sm:text-sm">
          <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
          <span>{t("summary.tokenSaved")}</span>
        </div>
      );
    }

    case "ai": {
      const status = configs?.ai;
      const activeProviders = [
        status?.hasGemini && "Gemini",
        status?.hasOpenAi && "OpenAI",
        status?.hasAnthropic && "Anthropic",
        status?.hasDeepSeek && "DeepSeek",
      ].filter(Boolean) as string[];

      if (activeProviders.length === 0) {
        return (
          <div className="text-foreground flex items-center gap-2 text-xs sm:text-sm">
            <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
            <span>{t("summary.tokenSaved")}</span>
          </div>
        );
      }

      return (
        <dl className="space-y-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs sm:text-sm">
            <dt className="text-muted-foreground">{t("summary.providers")}</dt>
            <dd className="text-foreground font-medium">
              {activeProviders.join(", ")}
            </dd>
          </div>
          {status?.defaultProvider ? (
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs sm:text-sm">
              <dt className="text-muted-foreground">
                {t("summary.defaultProvider")}
              </dt>
              <dd className="text-foreground font-medium capitalize">
                {status.defaultProvider}
              </dd>
            </div>
          ) : null}
        </dl>
      );
    }

    case "spotify": {
      if (spotifyClientId) {
        return (
          <dl className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs sm:text-sm">
              <dt className="text-muted-foreground">{t("summary.clientId")}</dt>
              <dd className="text-foreground font-mono text-xs font-medium">
                {spotifyClientId}
              </dd>
            </div>
          </dl>
        );
      }
      return (
        <div className="text-foreground flex items-center gap-2 text-xs sm:text-sm">
          <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
          <span>{t("summary.tokenSaved")}</span>
        </div>
      );
    }

    case "google-calendar": {
      if (googleCalendarClientId) {
        return (
          <dl className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs sm:text-sm">
              <dt className="text-muted-foreground">{t("summary.clientId")}</dt>
              <dd className="text-foreground font-mono text-xs font-medium">
                {googleCalendarClientId}
              </dd>
            </div>
          </dl>
        );
      }
      return (
        <div className="text-foreground flex items-center gap-2 text-xs sm:text-sm">
          <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
          <span>{t("summary.tokenSaved")}</span>
        </div>
      );
    }

    case "ilovepdf": {
      return (
        <div className="text-foreground flex items-center gap-2 text-xs sm:text-sm">
          <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
          <span>{t("summary.tokenSaved")}</span>
        </div>
      );
    }

    default:
      return null;
  }
}
