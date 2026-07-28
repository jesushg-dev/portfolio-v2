"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
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
  const { id: provider, icon: Icon } = catalogItem;

  return (
    <Card data-integration={provider} data-available className="border-dashed">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div className="flex items-start gap-3">
          <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            <Icon className="text-muted-foreground h-5 w-5" aria-hidden />
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

        <Link
          href={{
            pathname: "/admin/credentials/[provider]",
            params: { provider },
          }}
          className={buttonVariants({ size: "sm", className: "shrink-0" })}
        >
          {t("actions.connect")}
        </Link>
      </CardHeader>
    </Card>
  );
}
