"use client";

import { useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { api, type RouterOutputs } from "@/trpc/react";
import { Link } from "@/i18n/routing";
import type { IntegrationProvider } from "@/lib/integrations/tenant-integrations-service";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { IntegrationCatalogItem } from "../lib/integration-catalog";

type IntegrationConfigs = RouterOutputs["integrationsAdmin"]["getConfigs"];

function ConnectedDetails({
  provider,
  configs,
  t,
}: {
  provider: Exclude<IntegrationProvider, "spotify" | "google-calendar">;
  configs: IntegrationConfigs;
  t: ReturnType<typeof useTranslations<"adminCredentials">>;
}) {
  switch (provider) {
    case "resend": {
      const status = configs.resend;
      const items = [
        status.emailDomain && (
          <li key="domain">
            {t("summary.domain")}:{" "}
            <span className="text-foreground font-medium">
              {status.emailDomain}
            </span>
          </li>
        ),
        status.syncedTemplatesCount > 0 && (
          <li key="synced">
            {t("status.syncedCount", { count: status.syncedTemplatesCount })}
          </li>
        ),
      ].filter(Boolean);

      if (items.length === 0) return null;

      return (
        <ul className="text-muted-foreground space-y-1 text-sm">{items}</ul>
      );
    }
    case "uploadthing": {
      const status = configs.uploadthing;
      if (!status.appId) {
        return (
          <p className="text-muted-foreground text-sm">
            {t("summary.tokenSaved")}
          </p>
        );
      }

      return (
        <p className="text-muted-foreground text-sm">
          {t("summary.appId")}:{" "}
          <span className="text-foreground font-medium">{status.appId}</span>
        </p>
      );
    }
    case "ai": {
      const status = configs.ai;
      const providers = [
        status.hasGemini && "Gemini",
        status.hasOpenAi && "OpenAI",
        status.hasAnthropic && "Anthropic",
        status.hasDeepSeek && "DeepSeek",
      ].filter(Boolean);

      if (providers.length === 0) return null;

      return (
        <ul className="text-muted-foreground space-y-1 text-sm">
          <li>
            {t("summary.providers")}:{" "}
            <span className="text-foreground">{providers.join(", ")}</span>
          </li>
          {status.defaultProvider && (
            <li>
              {t("summary.defaultProvider")}:{" "}
              <span className="text-foreground capitalize">
                {status.defaultProvider}
              </span>
            </li>
          )}
        </ul>
      );
    }
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
}

export function IntegrationCard({
  catalogItem,
  configs,
}: {
  catalogItem: IntegrationCatalogItem;
  configs: IntegrationConfigs;
}) {
  const t = useTranslations("adminCredentials");
  const utils = api.useUtils();
  const [isPending, startTransition] = useTransition();

  const deleteIntegration =
    api.integrationsAdmin.deleteIntegration.useMutation();
  const syncTemplates = api.integrationsAdmin.syncResendTemplates.useMutation();

  const { id: provider, icon: Icon, accentClass, badgeClass } = catalogItem;

  const handleDisconnect = useCallback(() => {
    startTransition(async () => {
      try {
        await deleteIntegration.mutateAsync({
          provider: provider as Exclude<
            IntegrationProvider,
            "spotify" | "google-calendar"
          >,
        });
        await utils.integrationsAdmin.getConfigs.invalidate();
        toast.success(t("actions.disconnectSuccess"));
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("actions.disconnectFailed"),
        );
      }
    });
  }, [deleteIntegration, provider, utils, t]);

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

  const details = (
    <ConnectedDetails
      provider={
        provider as Exclude<IntegrationProvider, "spotify" | "google-calendar">
      }
      configs={configs}
      t={t}
    />
  );

  return (
    <Card
      data-integration={provider}
      className="border-border group flex flex-col justify-between transition-all duration-200 hover:shadow-sm"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${accentClass} transition-transform group-hover:scale-105`}
            >
              <Icon className="size-5.5" aria-hidden />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  {t(`providers.${provider}.name`)}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`gap-1 text-[0.6875rem] font-medium ${badgeClass}`}
                >
                  <CheckCircle2 className="size-3" />
                  {t("status.configured")}
                </Badge>
              </div>
              <CardDescription className="text-xs leading-relaxed sm:text-sm">
                {t(`providers.${provider}.description`)}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {details && (
          <div className="bg-muted/40 border-border/80 rounded-lg border p-3">
            {details}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <span className="text-muted-foreground bg-muted/50 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
            {t(`tags.${provider}`)}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {provider === "resend" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSyncTemplates}
                disabled={isPending}
                className="gap-1.5 text-xs"
              >
                <RefreshCw
                  className={`size-3.5 ${isPending ? "animate-spin" : ""}`}
                />
                {t("resend.syncButton")}
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
                className: "text-xs",
              })}
            >
              {t("actions.update")}
            </Link>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              disabled={isPending || deleteIntegration.isPending}
              className="text-xs"
            >
              {deleteIntegration.isPending
                ? t("actions.disconnecting")
                : t("actions.disconnect")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
