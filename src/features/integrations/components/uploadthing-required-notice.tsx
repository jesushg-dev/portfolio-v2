"use client";

import type { FC } from "react";
import { HardDrive } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";

export const UploadThingRequiredNotice: FC = () => {
  const t = useTranslations("adminCredentials.uploadthing");

  return (
    <div
      className="border-border bg-muted/40 text-muted-foreground rounded-lg border border-dashed p-4 text-sm"
      data-testid="uploadthing-required-notice"
    >
      <div className="text-foreground mb-2 flex items-center gap-2 font-medium">
        <HardDrive className="size-4" aria-hidden />
        {t("requiredTitle")}
      </div>
      <p className="mb-3">{t("requiredMessage")}</p>
      <Link
        href={{
          pathname: "/admin/credentials/[provider]",
          params: { provider: "uploadthing" },
        }}
        className="text-primary font-medium underline-offset-4 hover:underline"
      >
        {t("requiredConnectCta")}
      </Link>
    </div>
  );
};
