"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Music2 } from "lucide-react";

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
    <Card data-integration="spotify">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Music2 className="text-foreground h-5 w-5" aria-hidden />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">
                {t("providers.spotify.name")}
              </CardTitle>
              <CardDescription>
                {t("providers.spotify.description")}
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
        {connection?.clientId && (
          <p className="text-muted-foreground text-sm">
            {t("summary.clientId")}:{" "}
            <span className="text-foreground font-mono text-xs">
              {connection.clientId}
            </span>
          </p>
        )}

        <Link
          href={{
            pathname: "/admin/credentials/[provider]",
            params: { provider: "spotify" },
          }}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("actions.manage")}
        </Link>
      </CardContent>
    </Card>
  );
}
