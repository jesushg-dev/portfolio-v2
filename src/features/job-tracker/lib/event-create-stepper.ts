import { defineStepper } from "@stepperize/react";
import { z } from "zod";

import type { EventType } from "@/features/job-tracker/types";

export const EVENT_TYPES = [
  "INTERVIEW",
  "TECHNICAL_TEST",
  "QUESTIONNAIRE",
  "PHONE_CALL",
  "MEETING",
  "FOLLOW_UP",
] as const satisfies readonly EventType[];

export const TYPE_DEFAULTS: Record<EventType, { duration: number }> = {
  INTERVIEW: { duration: 60 },
  TECHNICAL_TEST: { duration: 90 },
  QUESTIONNAIRE: { duration: 30 },
  PHONE_CALL: { duration: 30 },
  MEETING: { duration: 45 },
  FOLLOW_UP: { duration: 15 },
};

export const eventWhatSchema = z.object({
  applicationId: z.string().min(1),
  type: z.enum(EVENT_TYPES),
  title: z.string().min(1),
});

export const eventWhenSchema = z.object({
  scheduledDate: z.date(),
  duration: z.number().int().positive().optional(),
});

export const eventWhereSchema = z.object({
  isVirtual: z.boolean(),
  location: z.string().optional(),
  meetingLink: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
});

export const eventCreateStepper = defineStepper(
  [
    { id: "what", schema: eventWhatSchema },
    { id: "when", schema: eventWhenSchema },
    { id: "where", schema: eventWhereSchema },
  ],
  { linear: true, defaultStep: "what" },
);

export type EventWhatValues = z.infer<typeof eventWhatSchema>;
export type EventWhenValues = z.infer<typeof eventWhenSchema>;
export type EventWhereValues = z.infer<typeof eventWhereSchema>;
