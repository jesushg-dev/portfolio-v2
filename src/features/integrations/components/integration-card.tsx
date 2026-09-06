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
  catalogItem: {
    id: Exclude<IntegrationProvider, "spotify" | "google-calendar">;
    icon: IntegrationCatalogItem["icon"];
  };
  configs: IntegrationConfigs;
}) {
  const t = useTranslations("adminCredentials");
  const utils = api.useUtils();
  const [isPending, startTransition] = useTransition();

  const deleteIntegration =
    api.integrationsAdmin.deleteIntegration.useMutation();
  const syncTemplates = api.integrationsAdmin.syncResendTemplates.useMutation();

  const { id: provider, icon: Icon } = catalogItem;

  const handleDisconnect = useCallback(() => {
    startTransition(async () => {
      try {
        await deleteIntegration.mutateAsync({ provider });
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
    <ConnectedDetails provider={provider} configs={configs} t={t} />
  );

  return (
    <Card data-integration={provider}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Icon className="text-foreground h-5 w-5" aria-hidden />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">
                {t(`providers.${provider}.name`)}
              </CardTitle>
              <CardDescription>
                {t(`providers.${provider}.description`)}
              </CardDescription>
            </div>
          </div>

          <Badge
            variant="secondary"
            className="shrink-0 bg-emerald-500/10 text-emerald-600"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            {t("status.configured")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {details}

        <div className="flex flex-wrap gap-2">
          {provider === "resend" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSyncTemplates}
              disabled={isPending}
              className="gap-1.5"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
              />
              {t("resend.syncButton")}
            </Button>
          )}
          <Link
            href={{
              pathname: "/admin/credentials/[provider]",
              params: { provider },
            }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("actions.update")}
          </Link>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDisconnect}
            disabled={isPending || deleteIntegration.isPending}
          >
            {deleteIntegration.isPending
              ? t("actions.disconnecting")
              : t("actions.disconnect")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
