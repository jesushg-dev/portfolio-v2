"use client";

import { useTranslations } from "next-intl";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RESEND_JOB_TRACKER_EVENTS } from "@/lib/integrations/resend-email-events";

export function ResendWebhookSetup({ webhookUrl }: { webhookUrl: string }) {
  const t = useTranslations("adminCredentials.resend");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success(t("webhookCopied"));
    } catch { toast.error(t("webhookCopyFailed")); }
  };
  return <div className="space-y-4 text-sm">
    <p className="text-muted-foreground">{t("webhookPrerequisite")}</p>
    <ol className="list-decimal space-y-4 pl-5 marker:font-semibold">
      <li className="space-y-2">
        <p>{t("webhookStep1")}</p>
        <label htmlFor="resend-webhook-url" className="text-xs font-medium">{t("webhookUrl")}</label>
        <div className="flex items-start gap-2">
          <Input id="resend-webhook-url" readOnly value={webhookUrl} className="min-w-0 font-mono text-xs" onFocus={(event) => event.target.select()} />
          <Button type="button" size="sm" variant="outline" disabled={!webhookUrl} onClick={() => void copy()}><Copy aria-hidden className="size-4" />{t("webhookCopy")}</Button>
        </div>
        <p className="break-all text-xs text-muted-foreground">{webhookUrl}</p>
      </li>
      <li className="space-y-2">
        <p>{t("webhookStep2")}</p>
        <a href="https://resend.com/webhooks" target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>{t("webhookDashboard")}<ExternalLink className="ml-2 size-3.5" aria-hidden /></a>
      </li>
      <li className="space-y-2">
        <p>{t("webhookStep3")}</p>
        <ul className="grid gap-1 rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs sm:grid-cols-2">{RESEND_JOB_TRACKER_EVENTS.map((event) => <li key={event}>{event}</li>)}</ul>
      </li>
      <li>{t("webhookStep4")}</li>
      <li className="space-y-2"><p>{t("webhookStep5")}</p><a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary underline underline-offset-4">{t("webhookDomains")}<ExternalLink className="size-3.5" aria-hidden /></a></li>
      <li>{t("webhookStep6")}</li>
    </ol>
    <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">{t("webhookTroubleshooting")}</p>
  </div>;
}
