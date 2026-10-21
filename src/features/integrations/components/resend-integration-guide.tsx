"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, KeyRound, Globe, Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function ResendIntegrationGuide() {
  const t = useTranslations("adminCredentials");

  return (
    <aside className="bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg">
          <Mail className="size-4" aria-hidden />
        </div>
        <h3 className="text-foreground text-sm font-semibold">
          {t("guides.resend.title")}
        </h3>
      </div>

      <ol className="text-muted-foreground space-y-3 text-xs leading-relaxed">
        <li className="flex items-start gap-2.5">
          <span className="bg-muted text-foreground flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.6875rem] font-semibold">
            1
          </span>
          <span>{t("guides.resend.step1")}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="bg-muted text-foreground flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.6875rem] font-semibold">
            2
          </span>
          <span>{t("guides.resend.step2")}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="bg-muted text-foreground flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.6875rem] font-semibold">
            3
          </span>
          <span>{t("guides.resend.step3")}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="bg-muted text-foreground flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.6875rem] font-semibold">
            4
          </span>
          <span>{t("guides.resend.step4")}</span>
        </li>
      </ol>

      <div className="border-border/60 mt-1 flex flex-col gap-2 border-t pt-3">
        <a
          href="https://resend.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "w-full justify-between gap-2 text-xs",
          })}
        >
          <span className="inline-flex items-center gap-1.5 font-medium">
            <KeyRound className="size-3.5" aria-hidden />
            {t("guides.resend.dashboardLink")}
          </span>
          <ExternalLink className="size-3.5 opacity-70" aria-hidden />
        </a>

        <a
          href="https://resend.com/domains"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className:
              "text-muted-foreground hover:text-foreground w-full justify-between gap-2 text-xs",
          })}
        >
          <span className="inline-flex items-center gap-1.5">
            <Globe className="size-3.5" aria-hidden />
            {t("guides.resend.domainsLink")}
          </span>
          <ExternalLink className="size-3.5 opacity-70" aria-hidden />
        </a>
      </div>
    </aside>
  );
}
