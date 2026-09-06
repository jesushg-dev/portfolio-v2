# Admin CMS

All routes under `/[locale]/admin/*`. Layout (`src/app/[locale]/(admin)/admin/layout.tsx`) requires a Better Auth session and redirects to login otherwise. Data mutations use `protectedProcedure` and `ctx.user.id`.

Dashboard shell: `dashboard-shell.tsx` (sidebar). Intercepting routes under `admin/@modal` open create/edit dialogs without leaving the list.

## Resources

| Sidebar | Path | Feature folder | Notes |
| --- | --- | --- | --- |
| Overview | `/admin` | analytics + job stats | Session-scoped |
| Profile | `/admin/profile` | `profile`, `terminal` | Hero, about, console steps |
| CV | `/admin/cv` | `cv` | Header, contacts, education, languages, skills, experience, soft skills, additional, **personal references** |
| Skills / projects / certs / timeline / services / soft skills | `/admin/<name>` | matching feature | List + `#<resource>-add` IDs for e2e |
| Process pages | `/admin/process-pages` | `process-pages` | Templates WORKFLOW / QA |
| Now / Uses | `/admin/now`, `/admin/uses` | `now`, `uses` | Public routes still gated by `PUBLIC_PAGE_LIVE` |
| Job Tracker | `/admin/job-tracker` | `job-tracker` | [`job-tracker.md`](./job-tracker.md) |
| Credentials | `/admin/credentials` | `integrations` | [`tenant-credentials.md`](./tenant-credentials.md) |
| Settings | `/admin/settings` | auth + profile publish | 2FA, passkeys, `isPublished`, site brand |
| Spotify (legacy path) | `/admin/spotify` | often redirects at credentials | Prefer Credentials → Spotify |

Stable form IDs (`#skill-*`, `#cv-*`, `#timeline-*`, …) are required for Playwright. Do not rename without updating `e2e/helpers/`.

## Publish vs live flags

- **Profile `isPublished`:** non-primary tenants’ **CV** (page, `/api/cv/*`, `cv.getPublic`, email PDF). Primary owner CV is always public.
- **`PUBLIC_PAGE_LIVE`:** Now / Uses / colophon / stats 404 when false — [`public-pages.md`](./public-pages.md).
- **Process page `isPublished` / `showInNav`:** that page only.

## Seed export

Lists that have an export button download `portfolio-*.json` (or a zip of all). Scoped to the current user. See [`seed-and-export.md`](./seed-and-export.md).

## Languages

Admin can manage `AppLanguage` rows (`appLanguagesAdmin`). Public UI locales still come from `src/i18n/config.ts`; extra DB languages only affect CMS translation tabs if wired.
