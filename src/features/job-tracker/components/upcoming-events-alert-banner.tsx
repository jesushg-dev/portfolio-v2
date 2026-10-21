"use client";

import { useMemo, useState, type FC } from "react";
import {
  differenceInDays,
  differenceInHours,
  format,
  isToday,
  isTomorrow,
} from "date-fns";
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { EventTypeIcon } from "@/features/job-tracker/lib/event-type-icons";
import { getDateFnsLocale } from "@/features/job-tracker/lib/date-locale";
import { eventPrepHref } from "@/features/job-tracker/lib/event-prep-href";
import type { Locale } from "@/i18n/config";
import type { EventType, UpcomingEvent } from "@/features/job-tracker/types";
import { cn } from "@/lib/utils";

const IMMINENT_HOURS_THRESHOLD = 48;

interface UpcomingEventsAlertBannerProps {
  events: UpcomingEvent[];
  locale: Locale;
  onViewAgenda?: () => void;
  className?: string;
}

interface EventBadgeProps {
  eventDate: Date;
  dateFnsLocale: ReturnType<typeof getDateFnsLocale>;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}

const UrgentStatusBadge: FC<EventBadgeProps> = ({
  eventDate,
  dateFnsLocale,
  t,
}) => {
  const now = new Date();
  const hoursUntil = differenceInHours(eventDate, now);
  const daysUntil = differenceInDays(eventDate, now);

  if (isToday(eventDate)) {
    return (
      <span className="border-primary/20 bg-primary/10 text-primary relative inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold">
        <span className="relative flex size-2">
          <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
          <span className="bg-primary relative inline-flex size-2 rounded-full" />
        </span>
        {t("calendar.today")} ·{" "}
        {hoursUntil <= 1
          ? t("calendar.inHours", { hours: Math.max(hoursUntil, 1) })
          : t("calendar.inHours", { hours: hoursUntil })}
      </span>
    );
  }

  if (isTomorrow(eventDate)) {
    return (
      <span className="border-border bg-muted/60 text-foreground relative inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold">
        <span className="bg-primary/70 relative inline-flex size-2 rounded-full" />
        {t("calendar.tomorrow")}
      </span>
    );
  }

  return (
    <span className="border-border bg-muted/60 text-muted-foreground relative inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold">
      {daysUntil <= 2
        ? t("calendar.inDays", { days: Math.max(daysUntil, 1) })
        : format(eventDate, "EEE dd MMM", { locale: dateFnsLocale })}
    </span>
  );
};

export const UpcomingEventsAlertBanner: FC<UpcomingEventsAlertBannerProps> = ({
  events,
  locale,
  onViewAgenda,
  className,
}) => {
  const t = useTranslations("admin.jobTracker");
  const [dismissed, setDismissed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const dateFnsLocale = getDateFnsLocale(locale);

  const imminentEvents = useMemo(() => {
    const now = new Date();
    return events.filter((event) => {
      const scheduled = new Date(event.scheduledDate);
      const diffHours = differenceInHours(scheduled, now);
      return diffHours >= -1 && diffHours <= IMMINENT_HOURS_THRESHOLD;
    });
  }, [events]);

  if (dismissed || imminentEvents.length === 0) {
    return null;
  }

  const safeIndex = Math.min(currentIndex, imminentEvents.length - 1);
  const activeEvent = imminentEvents[safeIndex] ?? imminentEvents[0];
  const scheduledDate = new Date(activeEvent.scheduledDate);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % imminentEvents.length);
  };

  const handlePrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + imminentEvents.length) % imminentEvents.length,
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        role="region"
        aria-label={t("calendar.urgentAlertTitle")}
        className={cn(
          "border-primary/30 bg-primary/5 text-card-foreground relative overflow-hidden rounded-xl border p-3.5 shadow-xs transition-all sm:p-4",
          className,
        )}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <UrgentStatusBadge
                eventDate={scheduledDate}
                dateFnsLocale={dateFnsLocale}
                t={t}
              />
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                <AlertCircle className="text-primary size-3.5" aria-hidden />
                {t("calendar.urgentAlertTitle")}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {imminentEvents.length > 1 ? (
                <div className="text-muted-foreground mr-1 flex items-center gap-1 text-xs">
                  <span className="tabular-nums">
                    {t("calendar.multipleUrgentCount", {
                      current: safeIndex + 1,
                      total: imminentEvents.length,
                    })}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 rounded-md"
                    onClick={handlePrev}
                    aria-label="Previous event"
                  >
                    <ChevronLeft className="size-3.5" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 rounded-md"
                    onClick={handleNext}
                    aria-label="Next event"
                  >
                    <ChevronRight className="size-3.5" aria-hidden />
                  </Button>
                </div>
              ) : null}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground size-7 rounded-lg"
                onClick={() => setDismissed(true)}
                aria-label={t("calendar.dismissAlert")}
              >
                <X className="size-3.5" aria-hidden />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="bg-primary/10 text-primary border-primary/20 flex size-9 shrink-0 items-center justify-center rounded-lg border">
                <EventTypeIcon type={activeEvent.type} className="size-4.5" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-foreground truncate text-sm font-semibold tracking-tight sm:text-base">
                    {activeEvent.title}
                  </h3>
                  <Badge variant="outline" className="text-[10px]">
                    {t(`eventType.${activeEvent.type as EventType}`)}
                  </Badge>
                </div>

                <p className="text-muted-foreground truncate text-xs sm:text-sm">
                  <span className="text-foreground font-medium">
                    {activeEvent.application.company.name}
                  </span>
                  {activeEvent.application.position
                    ? ` · ${activeEvent.application.position}`
                    : null}
                </p>

                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Clock className="text-primary size-3.5" aria-hidden />
                    {format(scheduledDate, "HH:mm")}
                    {activeEvent.duration
                      ? ` (${t("calendar.duration", { minutes: activeEvent.duration })})`
                      : null}
                  </span>

                  {activeEvent.isVirtual ? (
                    <span className="inline-flex items-center gap-1">
                      <Video className="size-3.5 text-blue-500" aria-hidden />
                      {t("calendar.virtual")}
                    </span>
                  ) : activeEvent.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" aria-hidden />
                      <span className="truncate">{activeEvent.location}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
              {activeEvent.isVirtual && activeEvent.meetingLink ? (
                <a
                  href={activeEvent.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    size: "sm",
                    variant: "default",
                  })}
                >
                  <Video className="mr-1.5 size-3.5" aria-hidden />
                  {t("calendar.joinMeeting")}
                  <ExternalLink
                    className="ml-1 size-3 opacity-70"
                    aria-hidden
                  />
                </a>
              ) : null}

              <Link
                href={eventPrepHref(activeEvent.application.id, activeEvent.id)}
                className={buttonVariants({
                  size: "sm",
                  variant: "outline",
                })}
              >
                <Sparkles
                  className="text-primary mr-1.5 size-3.5"
                  aria-hidden
                />
                {t("calendar.prepEvent")}
              </Link>

              {onViewAgenda ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onViewAgenda}
                  className="text-xs"
                >
                  <Calendar className="mr-1 size-3.5" aria-hidden />
                  {t("calendar.viewInAgenda")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
