"use client";

import { ArrowRight, CalendarPlus, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import type { ApplicationDetail } from "@/features/job-tracker/types";
import { eventPrepHref } from "@/features/job-tracker/lib/event-prep-href";
import {
  addBusinessDays,
  getApplicationNextStep,
} from "@/features/job-tracker/lib/application-next-step";

interface Props {
  application: ApplicationDetail;
  onOpenEmail: () => void;
  onOpenTimeline: () => void;
  onOpenTailor: () => void;
  onCompleteEvent: (eventId: string) => void;
  onMarkRejected: () => void;
  onSnoozeGhost: () => void;
  onCloseSearch?: () => void;
  pending: boolean;
  noticeCount?: number;
  hasSentCv?: boolean;
}

const descriptionKeys = {
  closed: "nextStep.closed",
  "pending-event": "nextStep.pending-event",
  offer: "nextStep.offer",
  interview: "nextStep.interview",
  ghosted: "nextStep.ghosted",
  "ghost-snoozed": "nextStep.ghost-snoozed",
  "follow-up": "nextStep.follow-up",
  tailor: "nextStep.tailor",
} as const;

export function ApplicationNextStepBanner({
  application,
  onOpenEmail,
  onOpenTimeline,
  onOpenTailor,
  onCompleteEvent,
  onMarkRejected,
  onSnoozeGhost,
  onCloseSearch,
  pending,
  noticeCount = 0,
  hasSentCv = false,
}: Props) {
  const t = useTranslations("admin.jobTracker");
  const locale = useLocale();
  const next = getApplicationNextStep(application);
  const dueDate = addBusinessDays(new Date(application.appliedDate), 5);
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const pendingEvent =
    next.kind === "pending-event"
      ? application.events.find((event) => event.id === next.eventId)
      : undefined;
  const waiting =
    next.kind === "tailor" || (next.kind === "follow-up" && !next.overdue);

  return (
    <section className="border-primary/20 bg-primary/5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
      <div className="max-w-3xl min-w-0">
        <p className="text-primary text-xs font-semibold">
          {t("nextStep.title")}
          {noticeCount > 0
            ? ` · ${t("nextStep.noticeCount", { count: noticeCount })}`
            : ""}
        </p>
        <h2 className="mt-1 text-lg font-semibold">
          {pendingEvent?.title ??
            (waiting
              ? t(
                  hasSentCv
                    ? "nextStep.awaitingReply"
                    : "nextStep.waitingTitle",
                )
              : t(descriptionKeys[next.kind]))}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {waiting && hasSentCv
            ? t("nextStep.sentCvHint")
            : next.kind === "follow-up" && !application.cvFile?.url
              ? t("nextStep.prepareCvBeforeFollowUp")
              : next.kind === "follow-up" && next.overdue
                ? t("nextStep.follow-upOverdue")
                : t(descriptionKeys[next.kind])}
        </p>
        {waiting ? (
          <p className="text-muted-foreground mt-1 text-sm">
            {t("nextStep.followUpDate", { date: dateFormat.format(dueDate) })}
          </p>
        ) : null}
        {pendingEvent ? (
          <p className="text-muted-foreground mt-1 text-sm">
            {new Intl.DateTimeFormat(locale, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(pendingEvent.scheduledDate))}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {next.kind === "pending-event" ? (
          <>
            {["INTERVIEW", "PHONE_CALL", "TECHNICAL_TEST"].includes(
              next.eventType,
            ) ? (
              <Button
                size="sm"
                render={
                  <Link href={eventPrepHref(application.id, next.eventId)} />
                }
              >
                {t("nextStep.prepare")} <ArrowRight aria-hidden />
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCompleteEvent(next.eventId)}
            >
              {t("timeline.complete")}
            </Button>
            <Button size="sm" variant="ghost" onClick={onOpenTimeline}>
              {t("nextStep.viewEvent")}
            </Button>
          </>
        ) : waiting ? (
          <>
            {!hasSentCv ? (
              <Button size="sm" onClick={onOpenTailor}>
                {t("nextStep.tailor")}
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              render={
                <Link
                  href={{
                    pathname: "/admin/job-tracker/events/new",
                    query: { applicationId: application.id, type: "FOLLOW_UP" },
                  }}
                />
              }
            >
              <CalendarPlus aria-hidden /> {t("nextStep.scheduleFollowUp")}
            </Button>
          </>
        ) : next.kind === "interview" ? (
          <Button
            size="sm"
            render={
              <Link
                href={{
                  pathname: "/admin/job-tracker/events/new",
                  query: { applicationId: application.id, type: "INTERVIEW" },
                }}
              />
            }
          >
            <CalendarPlus aria-hidden /> {t("nextStep.addInterview")}
          </Button>
        ) : next.kind === "follow-up" ? (
          <>
            {!application.cvFile?.url && !hasSentCv ? (
              <Button size="sm" onClick={onOpenTailor}>
                {t("nextStep.tailor")}
              </Button>
            ) : next.overdue ? (
              <Button size="sm" onClick={onOpenEmail}>
                {t("nextStep.sendFollowUp")}
              </Button>
            ) : (
              <Button
                size="sm"
                render={
                  <Link
                    href={{
                      pathname: "/admin/job-tracker/events/new",
                      query: {
                        applicationId: application.id,
                        type: "FOLLOW_UP",
                      },
                    }}
                  />
                }
              >
                <CalendarPlus aria-hidden /> {t("nextStep.scheduleFollowUp")}
              </Button>
            )}
            {application.cvFile?.url && !hasSentCv ? (
              <Button size="sm" variant="outline" onClick={onOpenTailor}>
                {t("nextStep.tailor")}
              </Button>
            ) : null}
          </>
        ) : next.kind === "ghosted" ? (
          <>
            <Button size="sm" onClick={onOpenEmail}>
              {t("nextStep.sendFollowUp")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={onSnoozeGhost}
            >
              {t("nextStep.snooze")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={onMarkRejected}
            >
              {t("nextStep.reject")}
            </Button>
          </>
        ) : next.kind === "offer" ? (
          <Button size="sm" variant="outline" onClick={onOpenTimeline}>
            {t("nextStep.reviewOffer")}
          </Button>
        ) : onCloseSearch ? (
          <Button size="sm" onClick={onCloseSearch}>
            <CheckCircle2 aria-hidden /> {t("nextStep.closeSearch")}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
