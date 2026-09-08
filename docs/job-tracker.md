# Job Tracker

Admin CRM for applications at `/admin/job-tracker`. Data is per logged-in user (`userId` on every model). Schema: `prisma/schema/job-tracker.prisma`. tRPC: `jobTrackerAdmin.*` in `src/features/job-tracker/server/job-tracker-admin.router.ts`.

This is **not** the public portfolio. Visitors never see applications.

## Model

```
Company 1──* Application 1──* ApplicationEvent
                     │
                     ├── CvFile (embedded name/url/uploadedAt)
                     ├── Document[]
                     ├── ResumeExport[]     (ATS tailor — resume-engine.prisma)
                     └── InterviewPrepQuestion[]
```

**Application status:** `APPLIED` | `INTERVIEW` | `OFFER` | `GHOSTED` | `REJECTED` | `HIRED`.

**Event type:** `INTERVIEW` | `TECHNICAL_TEST` | `QUESTIONNAIRE` | `PHONE_CALL` | `MEETING` | `FOLLOW_UP`.

Ghosted applications can be snoozed (`ghostNudgeSnoozedUntil`) so the dashboard stops nudging until that time.

## UI

| Route                                  | Role                                          |
| -------------------------------------- | --------------------------------------------- |
| `/admin/job-tracker`                   | Board / list, companies, upcoming events      |
| `/admin/job-tracker/applications/new`  | Create (modal + page)                         |
| `/admin/job-tracker/applications/[id]` | Detail tabs: details, timeline, tailor, email |
| `/admin/job-tracker/companies/...`     | Company CRUD                                  |

LinkedIn (and similar) URLs can be imported via `importJobFromUrl` — host allowlist + bounded redirects (`src/features/job-tracker/lib/fetch-linkedin-page.ts`). Failures map to `ImportFromUrlError` codes, not raw upstream HTML.

## Email and AI drafts

Outbound application mail uses **tenant Resend** (`getPortfolioEmailClient`). Cover-letter / email drafts use **tenant AI** keys. Missing credentials surface as UI errors pointing at Admin → Credentials — no platform `.env` fallback.

## Google Calendar

Incomplete events (interviews, meetings, …) sync to the tenant’s calendar when Google Calendar is connected. Events created already `completed` are not pushed. See [`tenant-credentials.md`](./tenant-credentials.md) (Google Calendar section).

Implementation: `src/lib/google-calendar/sync.ts`, OAuth callback `src/app/api/google-calendar/callback/route.ts`.

## Resume Engine hooks

From an application you can:

1. **Tailor** a DOCX to the job description → [`ats-cv-tailor.md`](./ats-cv-tailor.md) → writes `Application.cvFile`.
2. **Interview prep** questions stored on the application / event (`interviewPrepAdmin.*`).

E2E: `e2e/job-tracker-create-delete.spec.ts`, `e2e/jobs-create-delete.spec.ts` (Playwright project `jobs`).
