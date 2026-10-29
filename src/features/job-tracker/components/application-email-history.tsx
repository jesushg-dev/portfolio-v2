"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, MailOpen, RefreshCw, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/trpc/react";
import type { Locale } from "@/i18n/config";

interface ApplicationEmailHistoryProps {
  applicationId: string;
  locale: Locale;
  viewerEmail?: string;
  onOpenEmail?: () => void;
}

export function ApplicationEmailHistory({
  applicationId,
  locale,
  viewerEmail = "",
  onOpenEmail,
}: ApplicationEmailHistoryProps) {
  const t = useTranslations("admin.jobTracker.email");
  const [filter, setFilter] = useState<"all" | "company" | "copies">("all");
  const emailHistory = api.jobTrackerAdmin.getApplicationEmailHistory.useQuery(
    { applicationId },
    { refetchInterval: 15_000 },
  );

  const formatDate = (value: Date) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

  const emails = emailHistory.data ?? [];
  const isCopy = (recipient: string) =>
    Boolean(viewerEmail) &&
    recipient.trim().toLowerCase() === viewerEmail.trim().toLowerCase();
  const companyEmails = emails.filter(
    (email) => email.recipientKind !== "COPY" && !isCopy(email.recipientEmail),
  );
  const copyEmails = emails.filter(
    (email) => email.recipientKind === "COPY" || isCopy(email.recipientEmail),
  );
  const shownEmails =
    filter === "company"
      ? companyEmails
      : filter === "copies"
        ? copyEmails
        : emails;
  const sentToday = emails.filter(
    (email) =>
      email.sentAt &&
      new Date(email.sentAt).toDateString() === new Date().toDateString(),
  ).length;
  const opens = companyEmails.reduce(
    (total, email) => total + email.openCount,
    0,
  );

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
        <div className="flex items-center gap-2">
          {onOpenEmail ? (
            <Button size="sm" onClick={onOpenEmail}>
              <Send aria-hidden />
              {t("openButton")}
            </Button>
          ) : null}
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
        </div>
      </header>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {(
          [
            ["statTotal", emails.length],
            ["statCompany", companyEmails.length],
            ["statCopies", copyEmails.length],
            ["statToday", sentToday],
            ["statOpens", opens],
            [
              "delivery.DELIVERED",
              companyEmails.filter(
                (email) => email.deliveryStatus === "DELIVERED",
              ).length,
            ],
            [
              "delivery.BOUNCED",
              companyEmails.filter(
                (email) =>
                  email.deliveryStatus === "BOUNCED" ||
                  email.deliveryStatus === "FAILED",
              ).length,
            ],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="bg-muted/40 rounded-lg p-2.5">
            <dt className="text-muted-foreground text-xs">{t(label)}</dt>
            <dd className="text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as typeof filter)}
      >
        <TabsList variant="line" className="max-w-full overflow-x-auto">
          <TabsTrigger value="all">{t("filterAll")}</TabsTrigger>
          <TabsTrigger value="company">{t("filterCompany")}</TabsTrigger>
          <TabsTrigger value="copies">{t("filterCopies")}</TabsTrigger>
        </TabsList>
      </Tabs>
      <p className="text-muted-foreground text-xs">
        {t("trackingApproximation")}
      </p>
      {emailHistory.isLoading ? (
        <p className="text-muted-foreground text-sm">{t("historyLoading")}</p>
      ) : emailHistory.isError ? (
        <p className="text-destructive text-sm">{t("historyError")}</p>
      ) : shownEmails.length ? (
        <ul className="space-y-3">
          {shownEmails.map((email) => (
            <li
              key={email.id}
              className="bg-muted/40 space-y-1.5 rounded-lg p-3 text-xs"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-foreground font-medium">{email.subject}</p>
                {email.deliveryStatus ? (
                  <Badge
                    variant={
                      email.deliveryStatus === "BOUNCED" ||
                      email.deliveryStatus === "FAILED"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {t(
                      `delivery.${email.deliveryStatus as "SENT" | "DELIVERED" | "DELAYED" | "FAILED" | "BOUNCED" | "COMPLAINED"}`,
                    )}
                  </Badge>
                ) : null}
                <Badge variant="outline">
                  {email.trackingSource === "RESEND"
                    ? "Resend"
                    : t("historicalTracking")}
                </Badge>
                <Badge variant="outline">
                  {email.recipientKind === "COPY" ||
                  isCopy(email.recipientEmail)
                    ? t("copyChip")
                    : t("companyChip")}
                </Badge>
                <Badge
                  variant={email.trackingEnabled ? "secondary" : "outline"}
                >
                  {email.trackingSource === "RESEND"
                    ? t(
                        email.trackingEnabled
                          ? "providerConnected"
                          : "providerNotConnected",
                      )
                    : email.trackingEnabled
                      ? t("trackingEnabledChip")
                      : t("trackingDisabledChip")}
                </Badge>
              </div>
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
                  {t(
                    email.trackingSource === "RESEND"
                      ? "providerTrackingHint"
                      : "trackingDisabledForEmail",
                  )}
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
