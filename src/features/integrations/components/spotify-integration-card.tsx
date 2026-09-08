"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Music2, Settings } from "lucide-react";

import { api } from "@/trpc/react";
import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SpotifyIntegrationCard() {
  const t = useTranslations("adminCredentials");
  const statusQuery = api.spotifyAdmin.getConnectionStatus.useQuery();

  if (statusQuery.isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  const connection = statusQuery.data;

  return (
    <Card
      data-integration="spotify"
      className="border-border group flex flex-col justify-between transition-all duration-200 hover:shadow-sm"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-105">
              <Music2 className="size-5.5" aria-hidden />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  {t("providers.spotify.name")}
                </CardTitle>
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-[0.6875rem] font-medium text-emerald-600"
                >
                  <CheckCircle2 className="size-3" />
                  {t("status.configured")}
                </Badge>
              </div>
              <CardDescription className="text-xs leading-relaxed sm:text-sm">
                {t("providers.spotify.description")}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {connection?.clientId && (
          <div className="bg-muted/40 border-border/80 rounded-lg border p-3">
            <p className="text-muted-foreground text-xs sm:text-sm">
              {t("summary.clientId")}:{" "}
              <span className="text-foreground font-mono text-xs">
                {connection.clientId}
              </span>
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <span className="text-muted-foreground bg-muted/50 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
            {t("tags.spotify")}
          </span>

          <Link
            href={{
              pathname: "/admin/credentials/[provider]",
              params: { provider: "spotify" },
            }}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "gap-1.5 text-xs",
            })}
          >
            <Settings className="size-3.5" aria-hidden />
            <span>{t("actions.manage")}</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
