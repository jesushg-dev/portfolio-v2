"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Copy, Check, Calendar } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Link } from "@/i18n/routing";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";

export function GoogleCalendarIntegrationGuide() {
  const t = useTranslations("admin.googleCalendar");
  const redirectQuery = api.googleCalendarAdmin.getRedirectUri.useQuery();
  const [copied, setCopied] = useState(false);

  const handleCopyUri = async () => {
    if (!redirectQuery.data?.redirectUri) return;
    try {
      await navigator.clipboard.writeText(redirectQuery.data.redirectUri);
      setCopied(true);
      toast.success(t("redirectUriLabel"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore copy error
    }
  };

  return (
    <aside className="bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[#4285F4]/15 text-[#4285F4]">
          <Calendar className="size-4" aria-hidden />
        </div>
        <h3 className="text-foreground text-sm font-semibold">
          {t("connect.title")}
        </h3>
      </div>

      <Alert className="py-2.5 text-xs">
        <AlertDescription>{t("storagePolicy")}</AlertDescription>
      </Alert>

      {redirectQuery.data?.redirectUri && (
        <div className="bg-muted/40 rounded-lg border p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-foreground text-xs font-medium">
              {t("redirectUriLabel")}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-[0.6875rem]"
              onClick={() => {
                void handleCopyUri();
              }}
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-500" aria-hidden />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" aria-hidden />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
          <p className="text-muted-foreground mt-0.5 text-[0.6875rem]">
            {t("redirectUriHint")}
          </p>
          <code className="bg-muted text-foreground mt-2 block rounded-md px-2.5 py-1.5 font-mono text-[0.6875rem] break-all">
            {redirectQuery.data.redirectUri}
          </code>
        </div>
      )}

      <div className="bg-muted/40 rounded-lg border p-3.5">
        <p className="text-foreground text-xs font-medium">
          {t("scopesTitle")}
        </p>
        <ul className="text-muted-foreground mt-1.5 list-inside list-disc space-y-1 text-xs">
          <li>{t("scopes.calendarEvents")}</li>
        </ul>
      </div>

      <p className="text-muted-foreground text-xs">
        {t.rich("privacyNote", {
          link: (chunks) => (
            <Link
              href="/privacy"
              className="text-primary font-medium underline"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>

      <div className="border-border/60 mt-1 border-t pt-3">
        <a
          href="https://console.cloud.google.com/apis/credentials"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "w-full justify-between gap-2 text-xs",
          })}
        >
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Calendar className="size-3.5 text-[#4285F4]" aria-hidden />
            {t("connect.dashboardLink")}
          </span>
          <ExternalLink className="size-3.5 opacity-70" aria-hidden />
        </a>
      </div>
    </aside>
  );
}
