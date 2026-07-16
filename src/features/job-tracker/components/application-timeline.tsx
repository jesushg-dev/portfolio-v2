"use client";

import { useCallback, useState, useTransition, type FC } from "react";
import { format } from "date-fns";
import { CheckCircle, Circle, Clock, Edit, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import type {
  ApplicationDetail,
  ApplicationEvent,
  EventType,
} from "@/features/job-tracker/types";
import type { Locale } from "@/i18n/config";
import { eventTypeIcons } from "@/features/job-tracker/lib/constants";
import { getDateFnsLocale } from "@/features/job-tracker/lib/date-locale";

interface ApplicationTimelineProps {
  application: ApplicationDetail;
  locale: Locale;
}

export const ApplicationTimeline: FC<ApplicationTimelineProps> = ({
  application,
  locale,
}) => {
  const t = useTranslations("admin.jobTracker");
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [eventNotes, setEventNotes] = useState<Record<string, string>>({});
  const [eventOutcomes, setEventOutcomes] = useState<
    Record<string, ApplicationEvent["outcome"]>
  >({});
  const [isPending, startTransition] = useTransition();

  const utils = api.useUtils();
  const updateEvent = api.jobTrackerAdmin.updateEvent.useMutation();
  const dateFnsLocale = getDateFnsLocale(locale);

  const sortedEvents = [...application.events].sort(
    (a, b) =>
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime(),
  );

  const handleCompleteEvent = useCallback(
    (eventId: string) => {
      startTransition(async () => {
        try {
          const outcome = (eventOutcomes[eventId] ?? "NEUTRAL") as
            "POSITIVE" | "NEGATIVE" | "NEUTRAL";

          await updateEvent.mutateAsync({
            id: eventId,
            completed: true,
            completedAt: new Date(),
            notes: eventNotes[eventId] ?? "",
            outcome,
          });

          toast.success(t("timeline.completeSuccess"));
          await utils.jobTrackerAdmin.getApplicationById.invalidate({
            id: application.id,
          });
          await utils.jobTrackerAdmin.getUpcomingEvents.invalidate();

          setEditingEvent(null);
          setEventNotes((prev) => ({ ...prev, [eventId]: "" }));
          setEventOutcomes((prev) => ({ ...prev, [eventId]: "NEUTRAL" }));
        } catch {
          toast.error(t("timeline.completeError"));
        }
      });
    },
    [application.id, eventNotes, eventOutcomes, t, updateEvent, utils],
  );

  const getOutcomeColor = (outcome?: ApplicationEvent["outcome"]) => {
    switch (outcome) {
      case "POSITIVE":
        return "text-green-600";
      case "NEGATIVE":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t("timeline.title")}
            </CardTitle>
            <CardDescription>{t("timeline.description")}</CardDescription>
          </div>
          <Link
            href={{
              pathname: "/admin/job-tracker/events/new",
              query: { applicationId: application.id },
            }}
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("timeline.addEvent")}
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {sortedEvents.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>{t("timeline.empty")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedEvents.map((event, index) => (
              <div key={event.id} className="relative">
                {index < sortedEvents.length - 1 && (
                  <div className="bg-border absolute top-12 left-6 h-16 w-0.5" />
                )}

                <div className="flex gap-4">
                  <div className="mt-1 shrink-0">
                    {event.completed ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <Circle className="text-muted-foreground h-6 w-6" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {eventTypeIcons[event.type as EventType]}
                          </span>
                          <h4 className="font-medium">{event.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {t(`eventType.${event.type as EventType}`)}
                          </Badge>
                          {event.completed && event.outcome && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${getOutcomeColor(event.outcome)}`}
                            >
                              {t(
                                `timeline.outcome.${event.outcome as "POSITIVE" | "NEGATIVE" | "NEUTRAL"}`,
                              )}
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {format(new Date(event.scheduledDate), "PPP HH:mm", {
                            locale: dateFnsLocale,
                          })}
                          {event.duration &&
                            ` • ${t("calendar.duration", { minutes: event.duration })}`}
                        </p>
                        {event.description && (
                          <p className="text-muted-foreground text-sm">
                            {event.description}
                          </p>
                        )}
                        {event.location && !event.isVirtual && (
                          <p className="text-muted-foreground text-sm">
                            📍 {event.location}
                          </p>
                        )}
                        {event.isVirtual && event.meetingLink && (
                          <a
                            href={event.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-sm hover:underline"
                          >
                            {t("timeline.joinMeeting")}
                          </a>
                        )}
                      </div>

                      {!event.completed &&
                        new Date(event.scheduledDate) > new Date() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEditingEvent(
                                editingEvent === event.id ? null : event.id,
                              )
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {t("timeline.complete")}
                          </Button>
                        )}
                    </div>

                    {editingEvent === event.id && (
                      <div className="mt-4 space-y-4 rounded-lg border p-4">
                        <div>
                          <p className="text-sm font-medium">
                            {t("timeline.outcomeLabel")}
                          </p>
                          <Select
                            value={eventOutcomes[event.id] ?? "NEUTRAL"}
                            onValueChange={(value) => {
                              if (
                                value === "POSITIVE" ||
                                value === "NEGATIVE" ||
                                value === "NEUTRAL"
                              ) {
                                setEventOutcomes((prev) => ({
                                  ...prev,
                                  [event.id]: value,
                                }));
                              }
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="POSITIVE">
                                {t("timeline.outcome.POSITIVE")}
                              </SelectItem>
                              <SelectItem value="NEUTRAL">
                                {t("timeline.outcome.NEUTRAL")}
                              </SelectItem>
                              <SelectItem value="NEGATIVE">
                                {t("timeline.outcome.NEGATIVE")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {t("timeline.notesLabel")}
                          </p>
                          <Textarea
                            placeholder={t("timeline.notesPlaceholder")}
                            value={eventNotes[event.id] ?? ""}
                            onChange={(e) =>
                              setEventNotes((prev) => ({
                                ...prev,
                                [event.id]: e.target.value,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleCompleteEvent(event.id)}
                          >
                            {t("timeline.markCompleted")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingEvent(null)}
                          >
                            {t("timeline.cancel")}
                          </Button>
                        </div>
                      </div>
                    )}

                    {event.completed && event.notes && (
                      <div className="bg-muted/50 mt-2 rounded-lg p-3">
                        <p className="text-sm font-medium">
                          {t("timeline.notesLabel")}:
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {event.notes}
                        </p>
                        {event.completedAt && (
                          <p className="text-muted-foreground mt-2 text-xs">
                            {t("timeline.completedAt", {
                              date: format(
                                new Date(event.completedAt),
                                "PPP HH:mm",
                                { locale: dateFnsLocale },
                              ),
                            })}
                          </p>
                        )}
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
};
