"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FC,
  type FormEvent,
} from "react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Briefcase,
  CalendarIcon,
  Clock,
  LoaderCircle,
  MapPin,
  Video,
} from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { useRouter } from "@/i18n/routing";
import type {
  ApplicationListRow,
  EventType,
} from "@/features/job-tracker/types";
import type { Locale } from "@/i18n/config";
import type { EventCreateFormDTO } from "@/features/job-tracker/lib/event-editor-dto";
import { getDateFnsLocale } from "@/features/job-tracker/lib/date-locale";
import {
  EVENT_TYPES,
  TYPE_DEFAULTS,
  eventCreateStepper,
  eventWhatSchema,
  eventWhenSchema,
  eventWhereSchema,
  type EventWhatValues,
  type EventWhenValues,
  type EventWhereValues,
} from "@/features/job-tracker/lib/event-create-stepper";
import { eventPrepHref } from "@/features/job-tracker/lib/event-prep-href";
import { EVENT_TYPE_ICONS } from "@/features/job-tracker/lib/event-type-icons";
import { FormItem, FormError } from "@/components/shared/form-root";

const DURATION_PRESETS = [15, 30, 45, 60, 90];

interface EventFormProps {
  initialData: EventCreateFormDTO;
  applications: ApplicationListRow[];
  locale: Locale;
}

export const EventForm: FC<EventFormProps> = ({
  initialData,
  applications,
  locale,
}) => {
  const t = useTranslations("admin.forms.jobTrackerEvent");
  const defaultTitle =
    initialData.title.trim() || t(`eventType.${initialData.type}`);

  return (
    <eventCreateStepper.Provider
      defaultStep="what"
      defaultData={{
        what: {
          applicationId: initialData.applicationId,
          type: initialData.type,
          title: defaultTitle,
        },
        when: {
          scheduledDate: initialData.scheduledDate,
          duration: initialData.duration,
        },
        where: {
          isVirtual: initialData.isVirtual,
          location: initialData.location,
          meetingLink: initialData.meetingLink,
          description: initialData.description,
        },
      }}
    >
      <EventFormFlow
        initialData={initialData}
        applications={applications}
        locale={locale}
      />
    </eventCreateStepper.Provider>
  );
};

const EventFormFlow: FC<EventFormProps> = ({
  initialData,
  applications,
  locale,
}) => {
  const t = useTranslations("admin.forms.jobTrackerEvent");
  const stepper = eventCreateStepper.useStepper();
  const hideApplicationSelect = Boolean(initialData.applicationId);
  const linkedApplication = applications.find(
    (app) => app.id === initialData.applicationId,
  );
  const stepLabels = {
    what: t("stepper.what"),
    when: t("stepper.when"),
    where: t("stepper.where"),
  } as const;

  return (
    <div className="flex flex-col gap-6">
      {hideApplicationSelect && linkedApplication ? (
        <div className="bg-muted/40 flex items-start gap-3 rounded-xl px-3.5 py-3">
          <Briefcase
            className="text-muted-foreground mt-0.5 size-4 shrink-0"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {t("linkedApplication")}
            </p>
            <p className="mt-0.5 truncate text-sm font-medium">
              {linkedApplication.position}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {linkedApplication.company.name}
            </p>
          </div>
        </div>
      ) : null}

      <nav aria-label={t("stepper.label")} className="flex gap-1.5">
        {eventCreateStepper.steps.map((step, index) => {
          const active = stepper.is(step.id);
          const done = stepper.index > index;
          return (
            <button
              key={step.id}
              type="button"
              disabled={index > stepper.index}
              onClick={() => {
                if (index < stepper.index) void stepper.goTo(step.id);
              }}
              className={cn(
                "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-2 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              <span className="tabular-nums">{index + 1}</span>
              <span className="truncate">{stepLabels[step.id]}</span>
            </button>
          );
        })}
      </nav>

      {stepper.match({
        what: () => (
          <WhatStep
            applications={applications}
            hideApplicationSelect={hideApplicationSelect}
            initialApplicationId={initialData.applicationId}
          />
        ),
        when: () => <WhenStep locale={locale} />,
        where: () => <WhereStep />,
      })}
    </div>
  );
};

function WhatStep({
  applications,
  hideApplicationSelect,
  initialApplicationId,
}: {
  applications: ApplicationListRow[];
  hideApplicationSelect: boolean;
  initialApplicationId: string;
}) {
  const t = useTranslations("admin.forms.jobTrackerEvent");
  const stepper = eventCreateStepper.useStepper();
  const router = useRouter();
  const schema = useMemo(
    () =>
      eventWhatSchema.extend({
        applicationId: z.string().min(1, t("validation.applicationRequired")),
        title: z.string().min(1, t("validation.titleRequired")),
      }),
    [t],
  );
  const form = useForm<EventWhatValues>({
    resolver: zodResolver(schema),
    defaultValues: stepper.data.get("what"),
    mode: "onBlur",
  });
  const applicationItems = useMemo(
    () =>
      applications.map((app) => ({
        value: app.id,
        label: `${app.position} - ${app.company.name}`,
      })),
    [applications],
  );

  const applyEventType = useCallback(
    (nextType: EventType, currentType: EventType) => {
      const currentTitle = form.getValues("title").trim();
      const previousLabel = t(`eventType.${currentType}`);
      if (!currentTitle || currentTitle === previousLabel) {
        form.setValue("title", t(`eventType.${nextType}`));
      }
      const when = stepper.data.get("when");
      if (
        when &&
        (when.duration == null ||
          when.duration === TYPE_DEFAULTS[currentType].duration)
      ) {
        stepper.data.set("when", {
          ...when,
          duration: TYPE_DEFAULTS[nextType].duration,
        });
      }
    },
    [form, stepper.data, t],
  );

  const onSubmit = form.handleSubmit(async (data) => {
    const moved = await stepper.next({ data });
    if (moved) stepper.setComplete("what");
  });

  const goBack = () => {
    if (initialApplicationId) {
      router.push({
        pathname: "/admin/job-tracker/applications/[id]",
        params: { id: initialApplicationId },
      });
      return;
    }
    router.push("/admin/job-tracker");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          void onSubmit(event);
        }}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-4">
          {!hideApplicationSelect ? (
            <FormField
              control={form.control}
              name="applicationId"
              render={({ field }) => (
                <FormItem
                  label={t("fields.application")}
                  inputId="event-application"
                  required
                >
                  <Select
                    items={applicationItems}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger id="event-application" className="w-full">
                      <SelectValue
                        placeholder={t("placeholders.application")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.position} - {app.company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          ) : null}

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem label={t("fields.type")} inputId="event-type" required>
                <div
                  role="radiogroup"
                  aria-label={t("fields.type")}
                  className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                >
                  {EVENT_TYPES.map((value) => {
                    const Icon = EVENT_TYPE_ICONS[value];
                    const selected = field.value === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                          const previous = field.value;
                          field.onChange(value);
                          applyEventType(value, previous);
                        }}
                        className={cn(
                          "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors",
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-4",
                            selected ? "text-primary" : "text-muted-foreground",
                          )}
                          aria-hidden
                        />
                        <span
                          className={cn(
                            "text-[13px] font-medium",
                            selected && "text-primary",
                          )}
                        >
                          {t(`eventType.${value}`)}
                        </span>
                        <span className="text-muted-foreground line-clamp-2 text-[11px] leading-snug">
                          {t(`typeHint.${value}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem
                label={t("fields.title")}
                inputId="event-title"
                required
              >
                <Input
                  id="event-title"
                  placeholder={t("placeholders.title")}
                  {...field}
                />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button type="button" variant="outline" onClick={goBack}>
            {t("actions.cancel")}
          </Button>
          <Button type="submit">{t("stepper.next")}</Button>
        </div>
      </form>
    </Form>
  );
}

function WhenStep({ locale }: { locale: Locale }) {
  const t = useTranslations("admin.forms.jobTrackerEvent");
  const stepper = eventCreateStepper.useStepper();
  const dateFnsLocale = getDateFnsLocale(locale);
  const schema = useMemo(
    () =>
      eventWhenSchema.extend({
        scheduledDate: z.date({ message: t("validation.dateRequired") }),
        duration: z
          .number()
          .int()
          .positive(t("validation.durationInvalid"))
          .optional(),
      }),
    [t],
  );
  const form = useForm<EventWhenValues>({
    resolver: zodResolver(schema),
    defaultValues: stepper.data.get("when"),
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const moved = await stepper.next({ data });
    if (moved) stepper.setComplete("when");
  });

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          void onSubmit(event);
        }}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem
                  label={t("fields.scheduledDate")}
                  inputId="event-date"
                  required
                >
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          id="event-date"
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start pl-3 font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 size-4 opacity-50" />
                          {field.value
                            ? format(field.value, "PPP", {
                                locale: dateFnsLocale,
                              })
                            : t("placeholders.date")}
                        </Button>
                      }
                    />
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (!date) return;
                          const next = new Date(date);
                          if (field.value) {
                            next.setHours(
                              field.value.getHours(),
                              field.value.getMinutes(),
                            );
                          }
                          field.onChange(next);
                        }}
                        disabled={(date) => date < new Date("1900-01-01")}
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem
                  label={t("fields.scheduledTime")}
                  inputId="event-time"
                  required
                >
                  <Input
                    id="event-time"
                    type="time"
                    value={field.value ? format(field.value, "HH:mm") : ""}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(":");
                      const next = new Date(field.value ?? new Date());
                      next.setHours(
                        Number.parseInt(hours || "0", 10),
                        Number.parseInt(minutes || "0", 10),
                      );
                      field.onChange(next);
                    }}
                  />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem label={t("fields.duration")} inputId="event-duration">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {DURATION_PRESETS.map((minutes) => {
                      const selected = field.value === minutes;
                      return (
                        <button
                          key={minutes}
                          type="button"
                          onClick={() => field.onChange(minutes)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                            selected
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border text-muted-foreground hover:bg-muted/50",
                          )}
                        >
                          {t("durationMinutes", { minutes })}
                        </button>
                      );
                    })}
                  </div>
                  <Input
                    id="event-duration"
                    type="number"
                    min={1}
                    placeholder={t("placeholders.duration")}
                    icon={<Clock className="h-4 w-4" />}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        Number.parseInt(e.target.value, 10) || undefined,
                      )
                    }
                  />
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              stepper.data.set("when", form.getValues());
              void stepper.prev();
            }}
          >
            {t("stepper.back")}
          </Button>
          <Button type="submit">{t("stepper.next")}</Button>
        </div>
      </form>
    </Form>
  );
}

function WhereStep() {
  const t = useTranslations("admin.forms.jobTrackerEvent");
  const stepper = eventCreateStepper.useStepper();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const utils = api.useUtils();
  const createEvent = api.jobTrackerAdmin.createEvent.useMutation();
  const schema = useMemo(
    () =>
      eventWhereSchema.extend({
        meetingLink: z
          .string()
          .url(t("validation.urlInvalid"))
          .optional()
          .or(z.literal("")),
      }),
    [t],
  );
  const form = useForm<EventWhereValues>({
    resolver: zodResolver(schema),
    defaultValues: stepper.data.get("where"),
    mode: "onBlur",
  });
  const isVirtual = useWatch({ control: form.control, name: "isVirtual" });
  const saving = isPending || createEvent.isPending;

  const saveEvent = (data: EventWhereValues) => {
    if (submittingRef.current) return;
    const what = stepper.data.get("what");
    const when = stepper.data.get("when");
    if (!what || !when) return;
    submittingRef.current = true;
    startTransition(async () => {
      setServerError(null);
      try {
        const created = await createEvent.mutateAsync({
          applicationId: what.applicationId,
          type: what.type,
          title: what.title,
          description: data.description ?? undefined,
          scheduledDate: when.scheduledDate,
          duration: when.duration ?? undefined,
          location: data.location ?? undefined,
          isVirtual: data.isVirtual,
          meetingLink: data.meetingLink ?? undefined,
        });

        toast.success(t("toast.success.title"), {
          description: t("toast.success.description", { title: what.title }),
        });

        await Promise.all([
          utils.jobTrackerAdmin.getUpcomingEvents.invalidate(),
          utils.jobTrackerAdmin.getApplicationById.invalidate(),
          utils.interviewPrepAdmin.getInterviewPrepPageData.invalidate(),
        ]);

        router.push(eventPrepHref(what.applicationId, created.id));
      } catch (err) {
        submittingRef.current = false;
        setServerError(
          err instanceof Error ? err.message : t("errors.unknown"),
        );
        toast.error(t("toast.error.title"), {
          description: t("toast.error.description"),
        });
      }
    });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void form.handleSubmit(saveEvent)(event);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          void onSubmit(event);
        }}
        className="flex flex-col gap-6"
      >
        <FormError error={serverError ? new Error(serverError) : null} />
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="isVirtual"
            render={({ field }) => (
              <FormItem label={t("fields.isVirtual")} inputId="event-virtual">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => field.onChange(true)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                      field.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <Video className="size-4 shrink-0" aria-hidden />
                    {t("modalityVirtual")}
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                      !field.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <MapPin className="size-4 shrink-0" aria-hidden />
                    {t("modalityInPerson")}
                  </button>
                </div>
              </FormItem>
            )}
          />

          {isVirtual ? (
            <FormField
              control={form.control}
              name="meetingLink"
              render={({ field }) => (
                <FormItem label={t("fields.meetingLink")} inputId="event-link">
                  <Input
                    id="event-link"
                    type="url"
                    placeholder={t("placeholders.meetingLink")}
                    icon={<Video className="h-4 w-4" />}
                    {...field}
                  />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem label={t("fields.location")} inputId="event-location">
                  <Input
                    id="event-location"
                    placeholder={t("placeholders.location")}
                    icon={<MapPin className="h-4 w-4" />}
                    {...field}
                  />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem
                label={t("fields.description")}
                inputId="event-description"
              >
                <Textarea
                  id="event-description"
                  placeholder={t("placeholders.description")}
                  className="min-h-18"
                  {...field}
                />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => {
              stepper.data.set("where", form.getValues());
              void stepper.prev();
            }}
          >
            {t("stepper.back")}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            ) : null}
            {t("actions.submit")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
