# Resume Engine (import, tailor, interview prep)

Admin-only AI workflows on top of the CMS CV and Job Tracker. All model calls use **tenant AI keys** ([`tenant-credentials.md`](./tenant-credentials.md)). Manual JSON mode still works without keys.

tRPC: `resumeEngineAdmin.*`, `interviewPrepAdmin.*`. Schema extras: `prisma/schema/resume-engine.prisma`.

## Import

Upload a résumé (UploadThing `resumeImporter`, authenticated, 8 MB) → `CvSourceUpload` (`parsedDraft` JSON, status pending/preview/imported/failed) → apply into CMS `Cv*` rows.

Code: `src/features/cv/lib/cv-import-draft.ts`, `apply-adapted-sections-to-draft.ts`, `src/features/resume-engine/lib/ai/extract-structured.ts`.

## ATS tailor (DOCX)

Layout-preserving rewrite against a job description. Full pipeline: [`ats-cv-tailor.md`](./ats-cv-tailor.md). Output is **not** the public `/api/cv/pdf` portfolio file.

## Interview prep

From an application event (`INTERVIEW`, etc.), generate a question pack (category, model answer, talking points, evidence from CV, avoid list) and persist `InterviewPrepQuestion` rows.

UI: Job Tracker application tabs. Generator: `generateInterviewPrepPack` / `buildInterviewPrepPromptPackage`. Providers: `claude` | `openai` | `deepseek` | `gemini` resolved from tenant credentials (`defaultProvider` mapping in Credentials).

E2E: `e2e/cv-import-tailor.spec.ts` (needs tenant AI + UploadThing in the environment to go beyond UI chrome).
