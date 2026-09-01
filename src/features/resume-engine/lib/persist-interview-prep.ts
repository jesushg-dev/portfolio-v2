import type { PrismaClient } from "@prisma/client";

import type { InterviewPrepResult } from "@/features/resume-engine/lib/interview-prep-result";
import type { InterviewPrepStoredQuestion } from "@/features/resume-engine/lib/interview-prep-result";
import {
  InterviewPrepCategorySchema,
  prioritizeHireQuestions,
} from "@/features/resume-engine/lib/interview-prep-result";

function mapStored(row: {
  id: string;
  eventId: string;
  category: string;
  question: string;
  whyTheyAsk: string;
  modelAnswer: string;
  talkingPoints: string[];
  evidenceFromCv: string[];
  avoid: string[];
  createdAt: Date;
}): InterviewPrepStoredQuestion {
  const category = InterviewPrepCategorySchema.catch("role").parse(
    row.category,
  );
  return {
    id: row.id,
    eventId: row.eventId,
    category,
    question: row.question,
    whyTheyAsk: row.whyTheyAsk,
    modelAnswer: row.modelAnswer,
    talkingPoints: row.talkingPoints,
    evidenceFromCv: row.evidenceFromCv,
    avoid: row.avoid,
    createdAt: row.createdAt,
  };
}

export async function listInterviewPrepQuestions(
  db: PrismaClient,
  eventId: string,
  userId: string,
): Promise<InterviewPrepStoredQuestion[]> {
  const rows = await db.interviewPrepQuestion.findMany({
    where: { eventId, userId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(mapStored).sort((a, b) => {
    if (a.category === "hire" && b.category !== "hire") return -1;
    if (a.category !== "hire" && b.category === "hire") return 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

export async function persistInterviewPrepQuestions(
  db: PrismaClient,
  input: {
    userId: string;
    applicationId: string;
    eventId: string;
    result: InterviewPrepResult;
    provider: string;
    replace: boolean;
  },
): Promise<InterviewPrepStoredQuestion[]> {
  if (input.replace) {
    await db.interviewPrepQuestion.deleteMany({
      where: { eventId: input.eventId, userId: input.userId },
    });
  }

  await db.interviewPrepQuestion.createMany({
    data: prioritizeHireQuestions(input.result.questions).map((question) => ({
      userId: input.userId,
      applicationId: input.applicationId,
      eventId: input.eventId,
      category: question.category,
      question: question.question,
      whyTheyAsk: question.whyTheyAsk,
      modelAnswer: question.modelAnswer,
      talkingPoints: question.talkingPoints,
      evidenceFromCv: question.evidenceFromCv,
      avoid: question.avoid,
      locale: input.result.detectedLocale,
      provider: input.provider,
    })),
  });

  return listInterviewPrepQuestions(db, input.eventId, input.userId);
}
