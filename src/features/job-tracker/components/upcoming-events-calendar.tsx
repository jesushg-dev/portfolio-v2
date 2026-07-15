"use client";

import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { Calendar, Clock, MapPin, Video, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { eventTypeIcons } from "@/features/job-tracker/lib/constants";
import { getDateFnsLocale } from "@/features/job-tracker/lib/date-locale";
import type { Locale } from "@/i18n/config";
import type { EventType, UpcomingEvent } from "@/features/job-tracker/types";

interface UpcomingEventsCalendarProps {
  initialEvents: UpcomingEvent[];
  locale: Locale;
}

export function UpcomingEventsCalendar({
  initialEvents,
  locale,
}: UpcomingEventsCalendarProps) {
  const t = useTranslations("admin.jobTracker");
  const dateFnsLocale = getDateFnsLocale(locale);

  const { data: upcomingEvents = initialEvents } =
    api.jobTrackerAdmin.getUpcomingEvents.useQuery(
      { limit: 5 },
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t("calendar.title")}
            </CardTitle>
            <CardDescription>{t("calendar.description")}</CardDescription>
          </div>
          <Button
            size="sm"
            render={<Link href="/admin/job-tracker/events/new" />}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("calendar.add")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>{t("calendar.empty")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 transition-colors"
              >
                <div className="text-2xl">
                  {eventTypeIcons[event.type as EventType]}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{event.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {t(`eventType.${event.type as EventType}`)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {event.application.company.name} -{" "}
                    {event.application.position}
                  </p>
                  <div className="text-muted-foreground flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getEventTimeLabel(new Date(event.scheduledDate))}{" "}
                      {format(new Date(event.scheduledDate), "HH:mm")}
                    </div>
                    {event.duration && (
                      <span>
                        {t("calendar.duration", { minutes: event.duration })}
                      </span>
                    )}
                    {event.location && !event.isVirtual && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </div>
                    )}
                    {event.isVirtual && (
                      <div className="flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        {t("calendar.virtual")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
