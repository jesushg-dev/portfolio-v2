"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
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

const EVENT_OUTCOMES = ["POSITIVE", "NEUTRAL", "NEGATIVE"] as const;

interface ApplicationTimelineProps {
  application: ApplicationDetail;
  locale: Locale;
  variant?: "default" | "embedded";
  activityHint?: string;
}

export const ApplicationTimeline: FC<ApplicationTimelineProps> = ({
  application,
  locale,
  variant = "default",
  activityHint,
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

  const outcomeItems = useMemo(
    () =>
      EVENT_OUTCOMES.map((outcome) => ({
        value: outcome,
        label: t(`timeline.outcome.${outcome}`),
      })),
    [t],
  );

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

  const addEventLink = (
    <Link
      href={{
        pathname: "/admin/job-tracker/events/new",
        query: { applicationId: application.id },
      }}
      className={buttonVariants({ size: "sm", variant: "outline" })}
    >
      <Plus className="mr-2 h-4 w-4" />
      {t("timeline.addEvent")}
    </Link>
  );

  const timelineBody =
    sortedEvents.length === 0 ? (
      <div className="text-muted-foreground py-6 text-center text-sm">
        <Clock className="mx-auto mb-3 h-8 w-8 opacity-50" />
        <p>{t("timeline.empty")}</p>
      </div>
    ) : (
      <div
        className={variant === "embedded" ? "flex flex-col gap-3" : "space-y-6"}
      >
        {sortedEvents.map((event, index) => (
          <div key={event.id} className="relative">
            {variant === "default" && index < sortedEvents.length - 1 ? (
              <div className="bg-border absolute top-12 left-6 h-16 w-0.5" />
            ) : null}

            <div className="flex gap-2.5">
              <div className="mt-0.5 shrink-0">
                {event.completed ? (
                  <CheckCircle
                    className={
                      variant === "embedded"
                        ? "text-primary h-4 w-4"
                        : "h-6 w-6 text-green-600"
                    }
                  />
                ) : (
                  <Circle
                    className={
                      variant === "embedded"
                        ? "text-primary h-4 w-4"
                        : "text-muted-foreground h-6 w-6"
                    }
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div
                      className={
                        variant === "embedded"
                          ? "flex flex-col gap-0.5"
                          : "flex items-center gap-2"
                      }
                    >
                      {variant === "default" ? (
                        <span className="text-lg">
                          {eventTypeIcons[event.type as EventType]}
                        </span>
                      ) : null}
                      <h4
                        className={
                          variant === "embedded"
                            ? "text-[13px] font-medium"
                            : "font-medium"
                        }
                      >
                        {event.title}
                      </h4>
                      {variant === "default" ? (
                        <>
                          <Badge variant="outline" className="text-xs">
                            {t(`eventType.${event.type as EventType}`)}
                          </Badge>
                          {event.completed && event.outcome ? (
                            <Badge
                              variant="outline"
                              className={`text-xs ${getOutcomeColor(event.outcome)}`}
                            >
                              {t(
                                `timeline.outcome.${event.outcome as "POSITIVE" | "NEGATIVE" | "NEUTRAL"}`,
                              )}
                            </Badge>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                    <p
                      className={
                        variant === "embedded"
                          ? "text-muted-foreground text-xs"
                          : "text-muted-foreground text-sm"
                      }
                    >
                      {format(
                        new Date(event.scheduledDate),
                        variant === "embedded" ? "MMM d" : "PPP HH:mm",
                        { locale: dateFnsLocale },
                      )}
                      {variant === "default" && event.duration
                        ? ` • ${t("calendar.duration", { minutes: event.duration })}`
                        : null}
                    </p>
                    {variant === "default" && event.description ? (
                      <p className="text-muted-foreground text-sm">
                        {event.description}
                      </p>
                    ) : null}
                    {variant === "default" &&
                    event.location &&
                    !event.isVirtual ? (
                      <p className="text-muted-foreground text-sm">
                        📍 {event.location}
                      </p>
                    ) : null}
                    {variant === "default" &&
                    event.isVirtual &&
                    event.meetingLink ? (
                      <a
                        href={event.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm hover:underline"
                      >
                        {t("timeline.joinMeeting")}
                      </a>
                    ) : null}
                  </div>

                  {variant === "default" &&
                  !event.completed &&
                  new Date(event.scheduledDate) > new Date() ? (
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
                  ) : null}
                </div>

                {editingEvent === event.id ? (
                  <div className="mt-4 space-y-4 rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">
                        {t("timeline.outcomeLabel")}
                      </p>
                      <Select
                        items={outcomeItems}
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
                        <SelectTrigger className="mt-1 w-full">
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
                ) : null}

                {event.completed && event.notes ? (
                  <div className="bg-muted/50 mt-2 rounded-lg p-3">
                    <p className="text-sm font-medium">
                      {t("timeline.notesLabel")}:
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {event.notes}
                    </p>
                    {event.completedAt ? (
                      <p className="text-muted-foreground mt-2 text-xs">
                        {t("timeline.completedAt", {
                          date: format(
                            new Date(event.completedAt),
                            "PPP HH:mm",
                            { locale: dateFnsLocale },
                          ),
                        })}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    );

  if (variant === "embedded") {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">{addEventLink}</div>
        {timelineBody}
        {activityHint ? (
          <p className="text-muted-foreground text-xs">{activityHint}</p>
        ) : null}
      </div>
    );
  }

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
          {addEventLink}
        </div>
      </CardHeader>
      <CardContent>{timelineBody}</CardContent>
    </Card>
  );
};
