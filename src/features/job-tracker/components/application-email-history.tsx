"use client";

import { useTranslations } from "next-intl";
import { Loader2, MailOpen, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import type { Locale } from "@/i18n/config";

interface ApplicationEmailHistoryProps {
  applicationId: string;
  locale: Locale;
}

export function ApplicationEmailHistory({
  applicationId,
  locale,
}: ApplicationEmailHistoryProps) {
  const t = useTranslations("admin.jobTracker.email");
  const emailHistory = api.jobTrackerAdmin.getApplicationEmailHistory.useQuery(
    { applicationId },
    { refetchInterval: 15_000 },
  );

  const formatDate = (value: Date) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

  return (
    <section
      aria-labelledby="application-email-history-title"
      className="border-border space-y-3 border-b pb-5"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MailOpen className="text-muted-foreground size-4" aria-hidden />
          <h2
            id="application-email-history-title"
            className="text-sm font-semibold"
          >
            {t("historyTitle")}
          </h2>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={emailHistory.isFetching}
          onClick={() => void emailHistory.refetch()}
        >
          {emailHistory.isFetching ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="mr-1.5 size-3.5" aria-hidden />
          )}
          {t("refreshHistory")}
        </Button>
      </header>
      <p className="text-muted-foreground text-xs">
        {t("trackingApproximation")}
      </p>
      {emailHistory.isLoading ? (
        <p className="text-muted-foreground text-sm">{t("historyLoading")}</p>
      ) : emailHistory.isError ? (
        <p className="text-destructive text-sm">{t("historyError")}</p>
      ) : emailHistory.data?.length ? (
        <ul className="space-y-3">
          {emailHistory.data.map((email) => (
            <li
              key={email.id}
              className="bg-muted/40 space-y-1.5 rounded-lg p-3 text-xs"
            >
              <p className="text-foreground font-medium">{email.subject}</p>
              <p className="text-muted-foreground">
                {email.recipientEmail} ·{" "}
                {email.sentAt
                  ? formatDate(email.sentAt)
                  : t("historyDateUnavailable")}
              </p>
              {email.trackingEnabled ? (
                <div className="text-muted-foreground space-y-0.5">
                  <p>
                    {t("trackingFirstDetected")}:{" "}
                    {email.firstOpenedAt
                      ? formatDate(email.firstOpenedAt)
                      : t("trackingNotDetected")}
                  </p>
                  <p>
                    {t("trackingTotalLoads")}: {email.openCount}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {t("trackingDisabledForEmail")}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">{t("historyEmpty")}</p>
      )}
    </section>
  );
}
