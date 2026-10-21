"use client";

import { useMemo, useState, type FC } from "react";
import { format, isThisWeek, isToday, isTomorrow } from "date-fns";
import {
  Calendar,
  CalendarDays,
  Clock,
  ExternalLink,
  Filter,
  MapPin,
  Plus,
  Sparkles,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { api } from "@/trpc/react";
import { EventTypeIcon } from "@/features/job-tracker/lib/event-type-icons";
import { getDateFnsLocale } from "@/features/job-tracker/lib/date-locale";
import { eventPrepHref } from "@/features/job-tracker/lib/event-prep-href";
import type { Locale } from "@/i18n/config";
import type { EventType, UpcomingEvent } from "@/features/job-tracker/types";
import { cn } from "@/lib/utils";

const UPCOMING_EVENTS_QUERY_LIMIT = 20;

type AgendaFilter = "all" | "thisWeek" | "interview" | "technical";

interface UpcomingEventsCalendarProps {
  initialEvents: UpcomingEvent[];
  locale: Locale;
  variant?: "default" | "sidebar";
}

interface GoogleCalendarSyncHintProps {
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}

const GoogleCalendarSyncHint: FC<GoogleCalendarSyncHintProps> = ({ t }) => {
  const statusQuery = api.jobTrackerAdmin.getGoogleCalendarSyncStatus.useQuery(
    undefined,
    { staleTime: 60_000 },
  );

  if (!statusQuery.data?.connected) return null;

  return (
    <span className="border-border bg-muted/60 text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs">
      <span className="bg-primary size-1.5 rounded-full" />
      {statusQuery.data.status === "refresh_error"
        ? t("calendar.googleSyncError")
        : t("calendar.googleSyncActive")}
    </span>
  );
};

interface AgendaStatsProps {
  thisWeekCount: number;
  totalCount: number;
  virtualCount: number;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}

const AgendaStatsRow: FC<AgendaStatsProps> = ({
  thisWeekCount,
  totalCount,
  virtualCount,
  t,
}) => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="border-border/70 bg-card/60 flex items-center gap-3 rounded-xl border p-3 shadow-xs">
        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
          <CalendarDays className="size-4.5" aria-hidden />
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium">
            {t("calendar.statsThisWeek")}
          </p>
          <p className="text-foreground text-lg font-bold tracking-tight">
            {thisWeekCount}
          </p>
        </div>
      </div>

      <div className="border-border/70 bg-card/60 flex items-center gap-3 rounded-xl border p-3 shadow-xs">
        <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Calendar className="size-4.5" aria-hidden />
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium">
            {t("calendar.statsTotalUpcoming")}
          </p>
          <p className="text-foreground text-lg font-bold tracking-tight">
            {totalCount}
          </p>
        </div>
      </div>

      <div className="border-border/70 bg-card/60 flex items-center gap-3 rounded-xl border p-3 shadow-xs">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
          <Video className="size-4.5" aria-hidden />
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium">
            {t("calendar.statsVirtual")}
          </p>
          <p className="text-foreground text-lg font-bold tracking-tight">
            {virtualCount}
          </p>
        </div>
      </div>
    </div>
  );
};

interface AgendaEventCardProps {
  event: UpcomingEvent;
  dateFnsLocale: ReturnType<typeof getDateFnsLocale>;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}

const AgendaEventCard: FC<AgendaEventCardProps> = ({
  event,
  dateFnsLocale,
  t,
}) => {
  const scheduledDate = new Date(event.scheduledDate);

  const isCurrentDay = isToday(scheduledDate);
  const isNextDay = isTomorrow(scheduledDate);

  const dayOfWeek = isCurrentDay
    ? t("calendar.today")
    : isNextDay
      ? t("calendar.tomorrow")
      : format(scheduledDate, "EEEE", { locale: dateFnsLocale });

  const monthLabel = format(scheduledDate, "MMM", {
    locale: dateFnsLocale,
  }).toUpperCase();
  const dayNumber = format(scheduledDate, "d");

  return (
    <div
      className={cn(
        "border-border/70 bg-card hover:border-primary/40 relative flex flex-col gap-4 rounded-xl border p-4 shadow-xs transition-all hover:shadow-sm sm:flex-row sm:items-center sm:justify-between",
        isCurrentDay && "border-primary/30 bg-primary/2",
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={cn(
            "flex size-14 shrink-0 flex-col items-center justify-center rounded-xl border text-center transition-colors sm:size-16",
            isCurrentDay
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/70 bg-muted/40 text-foreground",
          )}
        >
          <span className="text-[10px] font-semibold tracking-wider">
            {monthLabel}
          </span>
          <span className="text-xl font-bold tracking-tight sm:text-2xl">
            {dayNumber}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="bg-card inline-flex items-center gap-1 text-[11px] font-medium"
            >
              <EventTypeIcon
                type={event.type}
                className="text-muted-foreground size-3"
              />
              {t(`eventType.${event.type as EventType}`)}
            </Badge>

            {isCurrentDay ? (
              <span className="bg-primary/15 text-primary border-primary/20 rounded-full border px-2 py-0.5 text-[10px] font-semibold">
                {t("calendar.today")}
              </span>
            ) : isNextDay ? (
              <span className="bg-muted text-muted-foreground border-border rounded-full border px-2 py-0.5 text-[10px] font-semibold">
                {t("calendar.tomorrow")}
              </span>
            ) : null}

            <span className="text-muted-foreground text-xs capitalize">
              {dayOfWeek}
            </span>
          </div>

          <h3 className="text-foreground truncate text-base font-semibold tracking-tight">
            {event.title}
          </h3>

          <p className="text-muted-foreground text-xs sm:text-sm">
            <span className="text-foreground font-medium">
              {event.application.company.name}
            </span>
            {event.application.position
              ? ` · ${event.application.position}`
              : null}
          </p>

          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1 font-medium">
              <Clock className="size-3.5" aria-hidden />
              {format(scheduledDate, "HH:mm")}
              {event.duration
                ? ` (${t("calendar.duration", { minutes: event.duration })})`
                : null}
            </span>

            {event.isVirtual ? (
              <span className="inline-flex items-center gap-1 text-blue-500">
                <Video className="size-3.5" aria-hidden />
                {t("calendar.virtual")}
              </span>
            ) : event.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden />
                <span className="truncate">{event.location}</span>
              </span>
            ) : null}
          </div>

          {event.description ? (
            <p className="text-muted-foreground line-clamp-1 text-xs">
              {event.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-col sm:items-end">
        {event.isVirtual && event.meetingLink ? (
          <a
            href={event.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              size: "sm",
              variant: "default",
            })}
          >
            <Video className="mr-1.5 size-3.5" aria-hidden />
            {t("calendar.joinMeeting")}
            <ExternalLink className="ml-1 size-3 opacity-70" aria-hidden />
          </a>
        ) : null}

        <Link
          href={eventPrepHref(event.application.id, event.id)}
          className={buttonVariants({
            size: "sm",
            variant: "outline",
          })}
        >
          <Sparkles className="text-primary mr-1.5 size-3.5" aria-hidden />
          {t("calendar.prepEvent")}
        </Link>
      </div>
    </div>
  );
};

export function UpcomingEventsCalendar({
  initialEvents,
  locale,
}: UpcomingEventsCalendarProps) {
  const t = useTranslations("admin.jobTracker");
  const dateFnsLocale = getDateFnsLocale(locale);
  const [filter, setFilter] = useState<AgendaFilter>("all");

  const { data: upcomingEvents = initialEvents } =
    api.jobTrackerAdmin.getUpcomingEvents.useQuery(
      { limit: UPCOMING_EVENTS_QUERY_LIMIT },
      { placeholderData: initialEvents },
    );

  const thisWeekCount = useMemo(() => {
    return upcomingEvents.filter((event) =>
      isThisWeek(new Date(event.scheduledDate), { weekStartsOn: 1 }),
    ).length;
  }, [upcomingEvents]);

  const virtualCount = useMemo(() => {
    return upcomingEvents.filter((event) => event.isVirtual).length;
  }, [upcomingEvents]);

  const filteredEvents = useMemo(() => {
    switch (filter) {
      case "thisWeek":
        return upcomingEvents.filter((event) =>
          isThisWeek(new Date(event.scheduledDate), { weekStartsOn: 1 }),
        );
      case "interview":
        return upcomingEvents.filter((event) => event.type === "INTERVIEW");
      case "technical":
        return upcomingEvents.filter(
          (event) => event.type === "TECHNICAL_TEST",
        );
      case "all":
      default:
        return upcomingEvents;
    }
  }, [upcomingEvents, filter]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto pr-1">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-foreground text-lg font-bold tracking-tight sm:text-xl">
              {t("calendar.title")}
            </h2>
            <GoogleCalendarSyncHint t={t} />
          </div>
          <p className="text-muted-foreground mt-1 max-w-2xl text-xs sm:text-sm">
            {t("calendar.description")}
          </p>
        </div>

        <Link
          href="/admin/job-tracker/events/new"
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="mr-1.5 size-4" aria-hidden />
          {t("calendar.scheduleEvent")}
        </Link>
      </div>

      <AgendaStatsRow
        thisWeekCount={thisWeekCount}
        totalCount={upcomingEvents.length}
        virtualCount={virtualCount}
        t={t}
      />

      <div className="border-border/70 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="text-muted-foreground mr-1 size-3.5" aria-hidden />
          <Button
            type="button"
            size="sm"
            variant={filter === "all" ? "default" : "ghost"}
            className="h-8 rounded-lg text-xs"
            onClick={() => setFilter("all")}
          >
            {t("calendar.filterAll")} ({upcomingEvents.length})
          </Button>

          <Button
            type="button"
            size="sm"
            variant={filter === "thisWeek" ? "default" : "ghost"}
            className="h-8 rounded-lg text-xs"
            onClick={() => setFilter("thisWeek")}
          >
            {t("calendar.filterThisWeek")} ({thisWeekCount})
          </Button>

          <Button
            type="button"
            size="sm"
            variant={filter === "interview" ? "default" : "ghost"}
            className="h-8 rounded-lg text-xs"
            onClick={() => setFilter("interview")}
          >
            {t("calendar.filterInterviews")}
          </Button>

          <Button
            type="button"
            size="sm"
            variant={filter === "technical" ? "default" : "ghost"}
            className="h-8 rounded-lg text-xs"
            onClick={() => setFilter("technical")}
          >
            {t("calendar.filterTechnical")}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {filteredEvents.length === 0 ? (
          <div className="border-border/60 bg-muted/20 flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center sm:p-12">
            <div className="bg-muted/70 text-muted-foreground mb-3 flex size-12 items-center justify-center rounded-full">
              <Calendar className="size-6 opacity-60" aria-hidden />
            </div>
            <h3 className="text-foreground text-sm font-semibold">
              {upcomingEvents.length === 0
                ? t("calendar.empty")
                : t("calendar.emptyFiltered")}
            </h3>
            <p className="text-muted-foreground mt-1 max-w-sm text-xs">
              {t("calendar.emptyDescription")}
            </p>
            <div className="mt-4">
              <Link
                href="/admin/job-tracker/events/new"
                className={buttonVariants({
                  size: "sm",
                  variant: "outline",
                })}
              >
                <Plus className="mr-1.5 size-4" aria-hidden />
                {t("calendar.scheduleEvent")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-6">
            {filteredEvents.map((event) => (
              <AgendaEventCard
                key={event.id}
                event={event}
                dateFnsLocale={dateFnsLocale}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
