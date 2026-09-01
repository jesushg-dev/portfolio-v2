import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";

import {
  CvImportDraftSchema,
  type CvImportDraft,
} from "@/features/cv/lib/cv-import-draft";
import { loadCvStructuredDraft } from "@/features/cv/lib/load-cv-structured-draft";
import {
  parseMatchAnalysis,
  type CvMatchAnalysis,
} from "@/features/resume-engine/lib/cv-match-analysis";
import {
  InterviewPrepEventTypeSchema,
  type InterviewPrepEventType,
} from "@/features/resume-engine/lib/interview-prep-result";

export interface InterviewPrepContext {
  applicationId: string;
  position: string;
  companyName: string;
  jobDescription: string;
  draft: CvImportDraft;
  matchAnalysis: CvMatchAnalysis | null;
  source: "export" | "studio";
  event: {
    id: string;
    type: InterviewPrepEventType;
    title: string;
    notes: string | null;
  };
}

export async function resolveInterviewPrepContext(
  db: PrismaClient,
  userId: string,
  applicationId: string,
  eventId: string,
): Promise<InterviewPrepContext> {
  const application = await db.application.findFirst({
    where: { id: applicationId, userId },
    include: { company: true },
  });

  if (!application) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  const event = await db.applicationEvent.findFirst({
    where: { id: eventId, applicationId, userId },
  });

  if (!event) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Event not found for this application.",
    });
  }

  const eventType = InterviewPrepEventTypeSchema.safeParse(event.type);
  if (!eventType.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This event type cannot be used for interview prep.",
    });
  }

  const latestExport = await db.resumeExport.findFirst({
    where: { applicationId, userId },
    orderBy: { createdAt: "desc" },
    select: {
      jobDescription: true,
      structuredSnapshot: true,
      matchAnalysis: true,
    },
  });

  const snapshot = latestExport
    ? CvImportDraftSchema.safeParse(latestExport.structuredSnapshot)
    : null;

  let draft: CvImportDraft | null = snapshot?.success ? snapshot.data : null;
  let source: "export" | "studio" = draft ? "export" : "studio";

  if (!draft) {
    const profile = await db.profile.findUnique({
      where: { userId },
      select: { defaultLocale: true },
    });
    const fallbackLocale =
      profile?.defaultLocale === "es" || profile?.defaultLocale === "nl"
        ? profile.defaultLocale
        : "en";
    draft = await loadCvStructuredDraft(db, userId, {
      locale: fallbackLocale,
      fallbackLocale,
    });
    source = "studio";
  }

  if (!draft) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "No structured resume found. Tailor a CV for this job or import one in Resume Studio first.",
    });
  }

  const fromExport = latestExport?.jobDescription?.trim();
  const fromApplication = application.description?.trim();
  const jobDescription = (
    fromExport && fromExport.length > 0
      ? fromExport
      : fromApplication && fromApplication.length > 0
        ? fromApplication
        : ""
  ).trim();

  if (jobDescription.length < 20) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Job description is too short. Add it on the application or run Tailor CV first.",
    });
  }

  return {
    applicationId: application.id,
    position: application.position,
    companyName: application.company.name,
    jobDescription,
    draft,
    matchAnalysis: parseMatchAnalysis(latestExport?.matchAnalysis ?? null),
    source,
    event: {
      id: event.id,
      type: eventType.data,
      title: event.title,
      notes: event.notes,
    },
  };
}
