"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarIcon, Clock, MapPin, Video } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField } from "@/components/ui/form";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type {
  ApplicationListRow,
  EventType,
} from "@/features/job-tracker/types";
import type { Locale } from "@/i18n/config";
import type { EventCreateFormDTO } from "@/features/job-tracker/lib/event-editor-dto";
import { getDateFnsLocale } from "@/features/job-tracker/lib/date-locale";
import {
  FormRoot,
  FormContent,
  FormSection,
  FormItem,
  FormActions,
} from "@/components/shared/form-root";

const EVENT_TYPES = [
  "INTERVIEW",
  "TECHNICAL_TEST",
  "QUESTIONNAIRE",
  "PHONE_CALL",
  "MEETING",
  "FOLLOW_UP",
] as const satisfies readonly EventType[];

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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const utils = api.useUtils();
  const createEvent = api.jobTrackerAdmin.createEvent.useMutation();
  const dateFnsLocale = getDateFnsLocale(locale);

  const eventSchema = useMemo(
    () =>
      z.object({
        applicationId: z.string().min(1, t("validation.applicationRequired")),
        type: z.enum(EVENT_TYPES),
        title: z.string().min(1, t("validation.titleRequired")),
        description: z.string().optional(),
        scheduledDate: z.date({ message: t("validation.dateRequired") }),
        duration: z
          .number()
          .int()
          .positive(t("validation.durationInvalid"))
          .optional(),
        location: z.string().optional(),
        isVirtual: z.boolean(),
        meetingLink: z
          .string()
          .url(t("validation.urlInvalid"))
          .optional()
          .or(z.literal("")),
      }),
    [t],
  );

  type EventFormData = z.infer<typeof eventSchema>;

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData as EventFormData,
    mode: "onBlur",
  });

  const isVirtual = useWatch({ control: form.control, name: "isVirtual" });
  const hideApplicationSelect = Boolean(initialData.applicationId);

  const handleSubmit = useCallback(
    (data: EventFormData) => {
      startTransition(async () => {
        setServerError(null);
        try {
          await createEvent.mutateAsync({
            applicationId: data.applicationId,
            type: data.type,
            title: data.title,
            description: data.description ?? undefined,
            scheduledDate: data.scheduledDate,
            duration: data.duration ?? undefined,
            location: data.location ?? undefined,
            isVirtual: data.isVirtual,
            meetingLink: data.meetingLink ?? undefined,
          });

          toast.success(t("toast.success.title"), {
            description: t("toast.success.description", { title: data.title }),
          });

          await utils.jobTrackerAdmin.getUpcomingEvents.invalidate();
          await utils.jobTrackerAdmin.getApplicationById.invalidate();
          router.back();
        } catch (err) {
          setServerError(
            err instanceof Error ? err.message : t("errors.unknown"),
          );
          toast.error(t("toast.error.title"), {
            description: t("toast.error.description"),
          });
        }
      });
    },
    [createEvent, router, t, utils],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <FormContent error={serverError ? new Error(serverError) : null}>
          {!hideApplicationSelect && (
            <FormSection title={t("sections.application")}>
              <FormField
                control={form.control}
                name="applicationId"
                render={({ field }) => (
                  <FormItem
                    label={t("fields.application")}
                    inputId="event-application"
                    required
                  >
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger id="event-application">
                          <SelectValue
                            placeholder={t("placeholders.application")}
                          />
                        </SelectTrigger>
                      </FormControl>
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
            </FormSection>
          )}

          <FormSection title={t("sections.info")}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem
                    label={t("fields.type")}
                    inputId="event-type"
                    required
                  >
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger id="event-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EVENT_TYPES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(`eventType.${value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection title={t("sections.dateTime")}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                          <FormControl>
                            <Button
                              id="event-date"
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value
                                ? format(field.value, "PPP HH:mm", {
                                    locale: dateFnsLocale,
                                  })
                                : t("placeholders.date")}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        }
                      />
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                        />
                        <div className="border-t p-3">
                          <Input
                            type="time"
                            value={
                              field.value ? format(field.value, "HH:mm") : ""
                            }
                            onChange={(e) => {
                              const [hours, minutes] =
                                e.target.value.split(":");
                              const newDate = new Date(
                                field.value ?? new Date(),
                              );
                              newDate.setHours(
                                Number.parseInt(hours),
                                Number.parseInt(minutes),
                              );
                              field.onChange(newDate);
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem
                    label={t("fields.duration")}
                    inputId="event-duration"
                  >
                    <Input
                      id="event-duration"
                      type="number"
                      placeholder={t("placeholders.duration")}
                      icon={<Clock className="h-4 w-4" />}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          Number.parseInt(e.target.value) || undefined,
                        )
                      }
                    />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          <FormSection title={t("sections.modality")}>
            <FormField
              control={form.control}
              name="isVirtual"
              render={({ field }) => (
                <FormItem
                  label={t("fields.isVirtual")}
                  description={t("fields.isVirtualDescription")}
                  inputId="event-virtual"
                >
                  <Switch
                    id="event-virtual"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />

            {isVirtual ? (
              <FormField
                control={form.control}
                name="meetingLink"
                render={({ field }) => (
                  <FormItem
                    label={t("fields.meetingLink")}
                    inputId="event-link"
                  >
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
                  <FormItem
                    label={t("fields.location")}
                    inputId="event-location"
                  >
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
          </FormSection>
        </FormContent>

        <FormActions
          isPending={isPending}
          title={t("actions.submit")}
          submitId="event-submit"
        >
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t("actions.cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
