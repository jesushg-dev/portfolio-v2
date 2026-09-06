"use client";

import { useState } from "react";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Plus,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { EventTypeIcon } from "@/features/job-tracker/lib/event-type-icons";
import { getDateFnsLocale } from "@/features/job-tracker/lib/date-locale";
import { eventPrepHref } from "@/features/job-tracker/lib/event-prep-href";
import type { Locale } from "@/i18n/config";
import type { EventType, UpcomingEvent } from "@/features/job-tracker/types";
import { cn } from "@/lib/utils";

const UPCOMING_EVENTS_QUERY_LIMIT = 20;

function GoogleCalendarSyncHint() {
  const t = useTranslations("admin.jobTracker");
  const statusQuery = api.jobTrackerAdmin.getGoogleCalendarSyncStatus.useQuery(
    undefined,
    { staleTime: 60_000 },
  );

  if (!statusQuery.data?.connected) return null;

  return (
    <p className="text-muted-foreground mt-1 text-xs">
      {statusQuery.data.status === "refresh_error"
        ? t("calendar.googleSyncError")
        : t("calendar.googleSyncActive")}
    </p>
  );
}

interface UpcomingEventsCalendarProps {
  initialEvents: UpcomingEvent[];
  locale: Locale;
  variant?: "default" | "sidebar";
}

export function UpcomingEventsCalendar({
  initialEvents,
  locale,
  variant = "default",
}: UpcomingEventsCalendarProps) {
  const t = useTranslations("admin.jobTracker");
  const dateFnsLocale = getDateFnsLocale(locale);
  const isSidebar = variant === "sidebar";
  const [expanded, setExpanded] = useState(false);

  const { data: upcomingEvents = initialEvents } =
    api.jobTrackerAdmin.getUpcomingEvents.useQuery(
      { limit: UPCOMING_EVENTS_QUERY_LIMIT },
      { placeholderData: initialEvents },
    );

  const visibleEvents = expanded ? upcomingEvents : upcomingEvents.slice(0, 1);
  const hiddenCount = Math.max(upcomingEvents.length - 1, 0);

  const getEventTimeLabel = (date: Date) => {
    if (isToday(date)) return t("calendar.today");
    if (isTomorrow(date)) return t("calendar.tomorrow");
    if (isThisWeek(date))
      return format(date, "EEEE", { locale: dateFnsLocale });
    return format(date, "dd MMM", { locale: dateFnsLocale });
  };

  return (
    <aside
      className={cn(
        "bg-card text-card-foreground border-border flex flex-col rounded-xl border shadow-sm",
        expanded && "max-lg:max-h-[min(70dvh,32rem)] lg:h-[calc(100dvh-13rem)]",
      )}
    >
      <div
        className={cn(
          "border-border flex items-start justify-between gap-3 border-b",
          isSidebar ? "p-3" : "p-6",
        )}
      >
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Calendar className="text-primary size-4" aria-hidden />
            {t("calendar.title")}
          </h2>
          {!isSidebar ? (
            <p className="text-muted-foreground mt-1 text-xs">
              {t("calendar.description")}
            </p>
          ) : null}
          <GoogleCalendarSyncHint />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-expanded={expanded}
            aria-label={
              expanded ? t("calendar.collapseAria") : t("calendar.expandAria")
            }
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? (
              <ChevronUp className="size-4" aria-hidden />
            ) : (
              <ChevronDown className="size-4" aria-hidden />
            )}
            <span className="ml-1 hidden sm:inline">
              {expanded ? t("calendar.collapse") : t("calendar.expand")}
            </span>
          </Button>
          <Link
            href="/admin/job-tracker/events/new"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            <Plus className="size-4" aria-hidden />
            {!isSidebar ? (
              <span className="ml-1.5">{t("calendar.add")}</span>
            ) : null}
          </Link>
        </div>
      </div>

      <div
        className={cn(
          "min-h-0 flex-1",
          isSidebar ? "p-3" : "p-6",
          expanded && "overflow-y-auto",
        )}
      >
        {upcomingEvents.length === 0 ? (
          <div
            className={cn(
              "text-muted-foreground text-center text-sm",
              expanded ? "py-8" : "py-3",
            )}
          >
            <Calendar
              className={cn(
                "mx-auto mb-2 opacity-40",
                expanded ? "size-8" : "size-6",
              )}
              aria-hidden
            />
            <p>{t("calendar.empty")}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {visibleEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                compact={isSidebar}
                getEventTimeLabel={getEventTimeLabel}
                t={t}
              />
            ))}
          </ul>
        )}
        {!expanded && hiddenCount > 0 ? (
          <p className="text-muted-foreground mt-2 text-center text-[11px]">
            {t("calendar.moreCount", { count: hiddenCount })}
          </p>
        ) : null}
      </div>
    </aside>
  );
}

function EventRow({
  event,
  compact,
  getEventTimeLabel,
  t,
}: {
  event: UpcomingEvent;
  compact: boolean;
  getEventTimeLabel: (date: Date) => string;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}) {
  const scheduledDate = new Date(event.scheduledDate);

  return (
    <li>
      <Link
        href={eventPrepHref(event.application.id, event.id)}
        className="hover:bg-muted/50 border-border block rounded-lg border p-3 transition-colors"
      >
        <div className="flex items-start gap-2.5">
          <EventTypeIcon
            type={event.type}
            className="text-muted-foreground mt-0.5 size-4 shrink-0"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-medium">
                {event.title}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {t(`eventType.${event.type as EventType}`)}
              </Badge>
            </div>
            <p className="text-muted-foreground line-clamp-2 text-xs">
              {event.application.company.name}
              {!compact ? ` · ${event.application.position}` : null}
            </p>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" aria-hidden />
                {getEventTimeLabel(scheduledDate)}{" "}
                {format(scheduledDate, "HH:mm")}
              </span>
              {event.duration ? (
                <span>
                  {t("calendar.duration", { minutes: event.duration })}
                </span>
              ) : null}
              {event.isVirtual ? (
                <span className="inline-flex items-center gap-1">
                  <Video className="size-3" aria-hidden />
                  {t("calendar.virtual")}
                </span>
              ) : event.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" aria-hidden />
                  <span className="truncate">{event.location}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
