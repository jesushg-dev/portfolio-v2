"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, Plus } from "lucide-react";

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

import type { IntegrationCatalogItem } from "../lib/integration-catalog";

interface AvailableIntegrationCardProps {
  catalogItem: IntegrationCatalogItem;
}

export function AvailableIntegrationCard({
  catalogItem,
}: AvailableIntegrationCardProps) {
  const t = useTranslations("adminCredentials");
  const { id: provider, icon: Icon, accentClass } = catalogItem;

  return (
    <Card
      data-integration={provider}
      data-available
      className="border-border hover:border-primary/40 group flex flex-col justify-between transition-all duration-200 hover:shadow-sm"
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
                <Badge variant="outline" className="text-[0.6875rem]">
                  {t("status.notConfigured")}
                </Badge>
              </div>
              <CardDescription className="text-xs leading-relaxed sm:text-sm">
                {t(`providers.${provider}.description`)}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-0 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted-foreground bg-muted/50 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
          {t(`tags.${provider}`)}
        </span>

        <Link
          href={{
            pathname: "/admin/credentials/[provider]",
            params: { provider },
          }}
          className={buttonVariants({
            variant: "default",
            size: "sm",
            className: "shrink-0 gap-1.5 self-end sm:self-auto",
          })}
        >
          <Plus className="size-3.5" aria-hidden />
          <span>{t("actions.connect")}</span>
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}
