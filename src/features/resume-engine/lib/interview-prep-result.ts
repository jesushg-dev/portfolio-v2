import { z } from "zod";

export const InterviewPrepEventTypeSchema = z.enum([
  "INTERVIEW",
  "TECHNICAL_TEST",
  "QUESTIONNAIRE",
  "PHONE_CALL",
  "MEETING",
  "FOLLOW_UP",
]);

export const InterviewPrepCategorySchema = z.enum([
  "hire",
  "intro",
  "behavioral",
  "role",
  "gap",
  "closing",
  "technical",
  "screening",
]);

export const InterviewPrepQuestionSchema = z.object({
  category: InterviewPrepCategorySchema,
  question: z.string().min(1),
  whyTheyAsk: z.string().min(1),
  modelAnswer: z.string().min(1),
  talkingPoints: z.array(z.string().min(1)).default([]),
  evidenceFromCv: z.array(z.string().min(1)).default([]),
  avoid: z.array(z.string().min(1)).default([]),
});

export const InterviewPrepResultSchema = z.object({
  detectedLocale: z.enum(["en", "es", "nl"]),
  questions: z.array(InterviewPrepQuestionSchema).min(3).max(14),
});

export type InterviewPrepEventType = z.infer<
  typeof InterviewPrepEventTypeSchema
>;
export type InterviewPrepCategory = z.infer<typeof InterviewPrepCategorySchema>;
export type InterviewPrepQuestion = z.infer<typeof InterviewPrepQuestionSchema>;
export type InterviewPrepResult = z.infer<typeof InterviewPrepResultSchema>;

export interface InterviewPrepStoredQuestion extends InterviewPrepQuestion {
  id: string;
  eventId: string;
  createdAt: Date;
}

export function prioritizeHireQuestions<T extends { category: string }>(
  questions: T[],
): T[] {
  const hire = questions.filter((question) => question.category === "hire");
  const rest = questions.filter((question) => question.category !== "hire");
  return [...hire, ...rest];
}
