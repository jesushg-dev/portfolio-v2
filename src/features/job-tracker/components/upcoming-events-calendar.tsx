"use client";

import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { Calendar, Clock, MapPin, Plus, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { eventTypeIcons } from "@/features/job-tracker/lib/constants";
import { getDateFnsLocale } from "@/features/job-tracker/lib/date-locale";
import type { Locale } from "@/i18n/config";
import type { EventType, UpcomingEvent } from "@/features/job-tracker/types";
import { cn } from "@/lib/utils";

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

  const { data: upcomingEvents = initialEvents } =
    api.jobTrackerAdmin.getUpcomingEvents.useQuery(
      { limit: isSidebar ? 4 : 5 },
      { placeholderData: initialEvents },
    );

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
        isSidebar ? "xl:sticky xl:top-6" : "",
      )}
    >
      <div
        className={cn(
          "border-border flex items-start justify-between gap-3 border-b",
          isSidebar ? "p-4" : "p-6",
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
        </div>
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

      <div className={cn(isSidebar ? "p-3" : "p-6")}>
        {upcomingEvents.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            <Calendar className="mx-auto mb-3 size-8 opacity-40" aria-hidden />
            <p>{t("calendar.empty")}</p>
          </div>
        ) : (
          <ul
            className={cn(
              "space-y-2",
              isSidebar && "max-h-[420px] overflow-y-auto",
            )}
          >
            {upcomingEvents.map((event) => (
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
        href={{
          pathname: "/admin/job-tracker/applications/[id]",
          params: { id: event.application.id },
        }}
        className="hover:bg-muted/50 border-border block rounded-lg border p-3 transition-colors"
      >
        <div className="flex items-start gap-2.5">
          <span className="text-lg leading-none" aria-hidden>
            {eventTypeIcons[event.type as EventType]}
          </span>
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
