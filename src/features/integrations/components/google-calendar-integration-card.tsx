"use client";

import { useTranslations } from "next-intl";
import { CalendarDays, CheckCircle2 } from "lucide-react";

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

export function GoogleCalendarIntegrationCard() {
  const t = useTranslations("adminCredentials");
  const statusQuery = api.googleCalendarAdmin.getConnectionStatus.useQuery();

  if (statusQuery.isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  const connection = statusQuery.data;

  return (
    <Card data-integration="google-calendar">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
              <CalendarDays className="text-foreground size-5" aria-hidden />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">
                {t("providers.google-calendar.name")}
              </CardTitle>
              <CardDescription>
                {t("providers.google-calendar.description")}
              </CardDescription>
            </div>
          </div>

          <Badge
            variant="secondary"
            className="shrink-0 bg-emerald-500/10 text-emerald-600"
          >
            <CheckCircle2 className="mr-1 size-3" />
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
            params: { provider: "google-calendar" },
          }}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("actions.manage")}
        </Link>
      </CardContent>
    </Card>
  );
}
