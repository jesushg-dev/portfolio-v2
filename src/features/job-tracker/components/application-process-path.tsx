"use client";

import { Check, Circle, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import type { Locale } from "@/i18n/config";
import type { ApplicationDetail } from "@/features/job-tracker/types";

interface Props {
  application: ApplicationDetail;
  locale: Locale;
  onCompleteEvent: (eventId: string) => void;
}

export function ApplicationProcessPath({
  application,
  locale,
  onCompleteEvent,
}: Props) {
  const t = useTranslations("admin.jobTracker");
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const events = [...application.events].sort(
    (a, b) =>
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime(),
  );
  const currentEventId = events.find((event) => !event.completed)?.id;

  return (
    <section
      aria-label={t("processPath.title")}
      className="border-border bg-card rounded-xl border p-4 shadow-sm"
    >
      <h2 className="text-muted-foreground mb-3 text-xs font-semibold">
        {t("processPath.title")}
      </h2>
      <ol className="flex overflow-x-auto pb-2">
        <li className="relative flex w-36 shrink-0 flex-col items-center gap-1 px-2 text-center">
          <span className="bg-primary text-primary-foreground relative z-10 grid size-8 place-items-center rounded-full">
            <Check className="size-4" aria-hidden />
          </span>
          <p className="text-xs font-semibold">{t("processPath.applied")}</p>
          <p className="text-muted-foreground text-xs">
            {dateFormat.format(new Date(application.appliedDate))}
          </p>
        </li>
        {events.map((event) => (
          <li
            key={event.id}
            aria-current={event.id === currentEventId ? "step" : undefined}
            className="before:bg-border relative flex w-36 shrink-0 flex-col items-center gap-1 px-2 text-center before:absolute before:top-4 before:right-1/2 before:h-0.5 before:w-full"
          >
            <span
              className={
                event.completed
                  ? "bg-primary text-primary-foreground relative z-10 grid size-8 place-items-center rounded-full"
                  : "border-primary bg-card text-primary relative z-10 grid size-8 place-items-center rounded-full border-2 border-dashed"
              }
            >
              {event.completed ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Circle className="size-3" aria-hidden />
              )}
            </span>
            <p className="line-clamp-2 text-xs font-semibold">{event.title}</p>
            <p className="text-muted-foreground text-xs">
              {dateFormat.format(new Date(event.scheduledDate))}
            </p>
            {event.completed && event.outcome ? (
              <p className="text-muted-foreground mt-1 text-xs">
                {t(
                  `timeline.outcome.${event.outcome as "POSITIVE" | "NEUTRAL" | "NEGATIVE"}`,
                )}
              </p>
            ) : !event.completed ? (
              <Button
                variant="link"
                size="sm"
                className="mt-1 h-auto p-0"
                onClick={() => onCompleteEvent(event.id)}
              >
                {t("timeline.complete")}
              </Button>
            ) : null}
          </li>
        ))}
        <li className="before:bg-border relative flex w-36 shrink-0 flex-col items-center gap-1 px-2 text-center before:absolute before:top-4 before:right-1/2 before:h-0.5 before:w-full">
          <Button
            variant="outline"
            size="icon-sm"
            className="relative z-10 rounded-full border-dashed"
            render={
              <Link
                href={{
                  pathname: "/admin/job-tracker/events/new",
                  query: {
                    applicationId: application.id,
                    type:
                      application.status === "APPLIED"
                        ? "FOLLOW_UP"
                        : "INTERVIEW",
                  },
                }}
              />
            }
            aria-label={t("timeline.addEvent")}
          >
            <Plus aria-hidden />
          </Button>
          <p className="text-muted-foreground text-xs font-semibold">
            {t("timeline.addEvent")}
          </p>
        </li>
      </ol>
    </section>
  );
}
