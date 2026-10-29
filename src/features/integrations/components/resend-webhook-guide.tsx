"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, Globe, Webhook } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RESEND_JOB_TRACKER_EVENTS } from "@/lib/integrations/resend-email-events";

export function ResendWebhookGuide() {
  const t = useTranslations("adminCredentials");

  return (
    <aside className="bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg">
          <Webhook className="size-4" aria-hidden />
        </div>
        <h3 className="text-foreground text-sm font-semibold">
          {t("guides.resendWebhook.title")}
        </h3>
      </div>

      <p className="text-muted-foreground text-xs leading-relaxed">
        {t("resend.webhookPrerequisite")}
      </p>

      <ol className="text-muted-foreground space-y-3 text-xs leading-relaxed">
        <li className="flex items-start gap-2.5">
          <span className="bg-muted text-foreground flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.6875rem] font-semibold">
            1
          </span>
          <span>{t("resend.webhookStep1")}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="bg-muted text-foreground flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.6875rem] font-semibold">
            2
          </span>
          <span>{t("resend.webhookStep2")}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="bg-muted text-foreground flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.6875rem] font-semibold">
            3
          </span>
          <div className="space-y-1.5">
            <span>{t("resend.webhookStep3")}</span>
            <div className="flex flex-wrap gap-1 pt-1">
              {RESEND_JOB_TRACKER_EVENTS.map((event) => (
                <code
                  key={event}
                  className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-[0.6875rem]"
                >
                  {event}
                </code>
              ))}
            </div>
          </div>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="bg-muted text-foreground flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.6875rem] font-semibold">
            4
          </span>
          <span>{t("resend.webhookStep4")}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="bg-muted text-foreground flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.6875rem] font-semibold">
            5
          </span>
          <span>{t("resend.webhookStep5")}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="bg-muted text-foreground flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.6875rem] font-semibold">
            6
          </span>
          <span>{t("resend.webhookStep6")}</span>
        </li>
      </ol>

      <div className="border-border/60 mt-1 flex flex-col gap-2 border-t pt-3">
        <a
          href="https://resend.com/webhooks"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "w-full justify-between gap-2 text-xs",
          })}
        >
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Webhook className="size-3.5" aria-hidden />
            {t("resend.webhookDashboard")}
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
            {t("resend.webhookDomains")}
          </span>
          <ExternalLink className="size-3.5 opacity-70" aria-hidden />
        </a>
      </div>

      <p className="border-border/60 text-muted-foreground border-t pt-3 text-[0.6875rem] leading-normal">
        {t("resend.webhookTroubleshooting")}
      </p>
    </aside>
  );
}

