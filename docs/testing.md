# Testing Guide

This project uses **Jest** (via `next/jest`), **Testing Library**, and **jsdom** for unit and component tests.

## Quick start

```bash
pnpm test           # run once
pnpm test:watch     # watch mode
pnpm test:coverage  # with coverage report
pnpm type     # also runs in CI alongside tests
```

CI runs on every push and pull request via [`.github/workflows/test.yml`](../.github/workflows/test.yml):

- **unit** — lint, type, Jest, production build
- **e2e-smoke** — Playwright smoke against a local `next start` on the runner (isolated e2e database)
- **e2e-preview** — Playwright smoke against the Vercel Preview URL for the PR (pull requests only)

Full E2E suites (30–60 min) run nightly or on demand via [`.github/workflows/e2e-nightly.yml`](../.github/workflows/e2e-nightly.yml).

### CI secrets (GitHub environment: Preview)

Store secrets under **Settings → Environments → Preview** (not only at repository level). Each job declares `environment: Preview` so GitHub injects those secrets into `${{ secrets.* }}`.

| Secret                                     | Purpose                                                                                                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                              | Connection string to the **non-production** database. Must include the DB name in the path: `...mongodb.net/portfolio_e2e?...` (see troubleshooting below) |
| `BETTER_AUTH_SECRET`                       | Auth secret for CI builds and e2e                                                                                                                          |
| `OWNER_USER_EMAIL` / `OWNER_USER_PASSWORD` | Same credentials used by `pnpm db:seed` and Playwright login                                                                                               |
| `VERCEL_TOKEN`                             | Vercel API token for `wait-for-vercel-preview`                                                                                                             |
| `VERCEL_AUTOMATION_BYPASS_SECRET`          | Optional — only if Preview deployments use Vercel Deployment Protection                                                                                    |

Secret names must match what the app expects (`MONGODB_URI`, not `MONGODB_URI_E2E`).

### Vercel environment isolation

Scope `MONGODB_URI` per environment in the Vercel dashboard:

- **Production** → production database name
- **Preview** → e2e database name (same cluster, different DB — never share production data)

Preview deployments and CI both use the e2e database; production stays untouched.

#### One-time setup checklist

1. **Atlas** — create database `portfolio_e2e` on your non-prod cluster (or reuse the cluster from the Vercel integration with a different DB name in the URI).
2. **Vercel → Environment Variables** — set `MONGODB_URI` separately for Production vs Preview (Preview → `.../portfolio_e2e`).
3. **Vercel → Preview env** — add `BETTER_AUTH_SECRET` (distinct from prod) and `BETTER_AUTH_URL` if Better Auth needs an explicit public URL on preview.
4. **Vercel → Deployment Protection** — if enabled on Preview, create an Automation Bypass secret and copy it to GitHub as `VERCEL_AUTOMATION_BYPASS_SECRET`.
5. **GitHub → Environments → Preview** — add all secrets from the table above (exact names).
6. **Vercel token** — create at [vercel.com/account/tokens](https://vercel.com/account/tokens) and save as `VERCEL_TOKEN`.
7. Open a test PR and confirm all three CI jobs pass (`unit`, `e2e-smoke`, `e2e-preview`).

#### Troubleshooting: Prisma P1013 (database name missing)

If CI fails with `Database must be defined in the connection string`, your `MONGODB_URI` points at the cluster host but **omits the database name**. Prisma requires it in the URI path:

```text
# Wrong — ends at host or only has ?query
mongodb+srv://user:pass@portfolio-e2e.xxxxx.mongodb.net/?retryWrites=true&w=majority

# Correct — /portfolio_e2e before the ?
mongodb+srv://user:pass@portfolio-e2e.xxxxx.mongodb.net/portfolio_e2e?retryWrites=true&w=majority
```

The cluster hostname (`portfolio-e2e.xxxxx.mongodb.net`) is **not** the database name. Add `/portfolio_e2e` (or any name you choose) after the host. MongoDB creates the database on first write.

Fix the secret in **GitHub → Environments → Preview** and the matching **Vercel → Preview** variable, then re-run the workflow.

Locally, `pnpm db:push` runs the same validation via `scripts/validate-mongodb-uri.mjs`.

## Where tests live

### Co-located with source (default)

Place each test file **next to** the module it covers:

```
src/components/curriculum-vitae/
  education.tsx
  education.test.tsx

src/app/[locale]/(portfolio)/curriculum-vitae/
  page.tsx
  page.test.tsx
```

**Why this approach:**

- Moving or deleting code keeps tests in sync automatically.
- App Router paths with route groups (`(portfolio)`) and catch-all segments (`[[...slug]]`) are awkward to mirror elsewhere.
- Tests are easy to find when editing a file.

### Shared infrastructure in `src/test-utils/`

Only **reusable** testing code goes here — not individual test suites:

| File / folder          | Role                                                                              |
| ---------------------- | --------------------------------------------------------------------------------- |
| `setup.ts`             | Global mocks loaded before every test (`next-intl`, `next/image`, `motion/react`) |
| `render-with-intl.tsx` | Wrapper around `render()` for components that call `useTranslations`              |
| `fixtures/`            | Shared mock data (e.g. `cv-data.ts`)                                              |
| `mocks/`               | Optional helpers for mocking tRPC or other clients                                |

### What we do **not** use

A top-level `tests/` folder that mirrors the entire `src/` tree. That structure tends to drift and duplicates awkward route paths. E2E tests (Playwright, when added) may live in a separate `e2e/` directory.

## Writing tests

### Pure functions

Test logic directly — no DOM, no mocks unless the function imports I/O:

```ts
// src/lib/i18n/localized.test.ts
import { getLocalizedText } from "./localized";

describe("getLocalizedText", () => {
  it("returns the translation for the requested locale", () => {
    expect(
      getLocalizedText(
        { default: "Hello", translations: { es: "Hola" } },
        "es",
      ),
    ).toBe("Hola");
  });
});
```

Extract inline logic from components when it is worth testing on its own (e.g. `resolve-certificate-tab.ts`, `format-issued-date.ts`).

### React components

Use `renderWithIntl` from `@/test-utils/render-with-intl`:

```tsx
import { screen } from "@testing-library/react";
import Education from "./education";
import { mockEducation } from "@/test-utils/fixtures/cv-data";
import { renderWithIntl } from "@/test-utils/render-with-intl";

it("renders localized degree name", () => {
  renderWithIntl(
    <Education educations={[mockEducation]} locale="es" defaultLocale="en" />,
  );
  expect(screen.getByText("Ciencias de la Computación")).toBeInTheDocument();
});
```

`next-intl` is mocked globally in `setup.ts` using strings from `messages/en.json`.

### Client components with tRPC

Mock the hook in the test file:

```ts
jest.mock("@/trpc/react", () => ({
  api: {
    portfolio: {
      getCertificates: {
        useInfiniteQuery: jest.fn(),
      },
    },
  },
}));
```

### App Router pages (Server Components)

Pages are async functions. Invoke them directly and render the returned JSX:

```tsx
const ui = await CvPage({ params: Promise.resolve({ locale: "en" }) });
renderWithIntl(ui as ReactElement);
```

Mock server-only dependencies in the test file:

- `next-intl/server` → `getTranslations`, `setRequestLocale`
- `@/server/db` → Prisma client methods
- `@/lib/tenant/resolve` → `resolveTenant`
- `@/i18n/routing` → `Link`
- `next/navigation` → `notFound`

Keep page tests to a few **smoke cases** (happy path, `notFound`, `generateMetadata`). Put detailed logic tests in components and utilities.

## i18n regression tests

- **Message key parity:** `src/lib/i18n/message-key-parity.test.ts` — asserts `messages/es.json` and `messages/nl.json` contain the same keys as `messages/en.json`. Runs in the unit CI job via `pnpm test`.
- **Seed locale completeness:** `src/lib/i18n/localized-completeness.test.ts` — validates `prisma/data/*.json` localized maps include `en`, `es`, and `nl`.
- **Audit script:** `node scripts/audit-locale-completeness.mjs` — same seed check for local diagnostics.
- **Locale switching E2E:** `e2e/locale-switching.spec.ts` — public smoke test for nav/about content across locales and Backend skills tab. Runs via `pnpm test:e2e` (`public-locale` + `smoke` projects).

## Configuration

| File                      | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `jest.config.mjs`         | `next/jest` wrapper, `jsdom`, `@/*` alias, `setupFilesAfterEnv` |
| `src/test-utils/setup.ts` | Global mocks and `@testing-library/jest-dom` matchers           |

## Conventions checklist

- [ ] Test file named `*.test.ts` or `*.test.tsx`
- [ ] Placed in the same directory as the source file
- [ ] Fixtures with real Prisma/router types (`satisfies` or typed helpers)
- [ ] No `any` to silence type errors in tests
- [ ] Pure logic extracted when component tests would be too heavy
- [ ] Both `pnpm test` and `pnpm type` pass before pushing

## Current coverage (portfolio)

The first test suite targets the public portfolio routes under `src/app/[locale]/(portfolio)`:

- **Utilities:** `getLocalizedText`, certificate tab resolution, date formatting
- **CV components:** `education`, `languages`, `soft-skills`, `cv-preview`
- **Certificate components:** `certification-item`, `filter-type`, `certification`
- **Pages:** `curriculum-vitae/page`, `certificates/[[...slug]]/page`

Expand to admin, auth, and tRPC routers incrementally using the same patterns.

## E2E tests (Playwright)

End-to-end tests live in `e2e/` and use Playwright. Locally, Playwright starts `pnpm dev` on `http://localhost:3000`. In CI, it uses `pnpm build && pnpm start` on the runner, or hits a Vercel Preview URL when `E2E_BASE_URL` is set.

### Prerequisites

1. Copy `e2e/env.example` values into `.env.local` (gitignored):
   - `OWNER_USER_EMAIL` / `OWNER_USER_PASSWORD` — same credentials used by `pnpm db:seed` and Playwright login
   - Optional `E2E_BASE_URL` (defaults to `http://localhost:3000`)
2. `e2e/helpers/fill-register-form.ts` ensures the owner exists via **sign-in or register UI** (`#register-*` IDs) before authenticated suites — no `pnpm db:seed` required for login. Run `pnpm db:seed` when you want the full portfolio fixture data.
3. Install browsers once: `pnpm exec playwright install chromium`
4. The test DB should be reachable via `MONGODB_URI` in `.env.local` when the dev server starts. **Never point local e2e or Preview at the production database.**

### Commands

| Script                                | What runs                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:e2e`                       | **Smoke** — login, dashboard, one skill, project, certification, CV contact, profile hero, timeline entry, and soft skill                   |
| `pnpm test:e2e:full`                  | **Full suites** — register + auth setup + all serial create projects (skills, projects, certifications, profile, timeline, soft-skills, cv) |
| `pnpm test:e2e:skills`                | Full **skills** suite — serial 42-skill create (`skills-create`)                                                                            |
| `pnpm test:e2e:skills:headed`         | Same as above with a visible browser (~3 min warm / longer on cold)                                                                         |
| `pnpm test:e2e:skills:ui`             | Playwright UI mode for the skills project                                                                                                   |
| `pnpm test:e2e:projects`              | Full **projects** suite — serial 19-project create (`projects-create`)                                                                      |
| `pnpm test:e2e:projects:headed`       | Projects suite with visible browser                                                                                                         |
| `pnpm test:e2e:projects:ui`           | Playwright UI mode for the projects project                                                                                                 |
| `pnpm test:e2e:certifications`        | Full **certifications** suite — serial 49-cert create                                                                                       |
| `pnpm test:e2e:certifications:headed` | Certifications suite with visible browser                                                                                                   |
| `pnpm test:e2e:certifications:ui`     | Playwright UI mode for the certifications project                                                                                           |
| `pnpm test:e2e:cv`                    | Full **CV** suite — serial rebuild from `portfolio-cv.json` (`cv-create`)                                                                   |
| `pnpm test:e2e:cv:headed`             | CV suite with visible browser                                                                                                               |
| `pnpm test:e2e:cv:ui`                 | Playwright UI mode for the CV project                                                                                                       |
| `pnpm test:e2e:profile`               | Full **profile** suite — hero + console from `portfolio-home.json` (`profile-create`)                                                       |
| `pnpm test:e2e:profile:headed`        | Profile suite with visible browser                                                                                                          |
| `pnpm test:e2e:profile:ui`            | Playwright UI mode for the profile project                                                                                                  |
| `pnpm test:e2e:timeline`              | Full **timeline** suite — serial 9-entry create from `portfolio-timeline.json`                                                              |
| `pnpm test:e2e:timeline:headed`       | Timeline suite with visible browser                                                                                                         |
| `pnpm test:e2e:timeline:ui`           | Playwright UI mode for the timeline project                                                                                                 |
| `pnpm test:e2e:soft-skills`           | Full **soft skills** suite — section + 8 items from `portfolio-soft-skills.json`                                                            |
| `pnpm test:e2e:soft-skills:headed`    | Soft skills suite with visible browser                                                                                                      |
| `pnpm test:e2e:soft-skills:ui`        | Playwright UI mode for the soft skills project                                                                                              |
| `pnpm test:e2e:ui`                    | Playwright UI for all projects                                                                                                              |

Auth session is saved to `e2e/.auth/user.json` by `e2e/auth.setup.ts` (gitignored).

### Skills fixture

Portfolio skills for seed and E2E share one source of truth:

- `prisma/data/portfolio-skills.json` — 42 skills used by `prisma/seed.ts`
- `e2e/fixtures/portfolio-skills.ts` — typed re-export for tests

`e2e/helpers/fill-skill-form.ts` fills the admin skill form via stable `#skill-*` input IDs. `cleanupUserSkills` removes **every** owner skill via tRPC before the skills suite (including legacy/orphan rows, not only fixture titles).

`ensure-portfolio-skills.ts` creates **missing** fixture skills via tRPC when a suite needs the skill picker (projects, certifications, CV). It does **not** delete existing skills — so running skills → projects in sequence keeps the 42 skills intact.

### Smoke vs full skills suite

- **`skills-smoke.spec.ts`** — creates **one** skill; fast enough for CI smoke (`pnpm test:e2e`).
- **`skills-create.spec.ts`** — **serial** run that creates all **42** skills through the UI; use `pnpm test:e2e:skills` locally or in a dedicated job. Expect a few minutes on a warm dev server; longer on cold start.

### Projects fixture

Portfolio projects for seed and E2E share one source of truth:

- `prisma/data/portfolio-projects.json` — 19 projects with translations and `skillKeys`
- `e2e/fixtures/portfolio-projects.ts` — typed re-export for tests

`e2e/helpers/fill-project-form.ts` fills the admin project form via `#project-*` IDs and selects associated skills through `SkillPicker` (`#skill-picker-*`). `cleanupUserProjects` clears all owner projects before each run; `ensurePortfolioSkills` fills in any missing fixture skills without touching other domains.

### Smoke vs full projects suite

- **`projects-smoke.spec.ts`** — creates **one** project; included in `pnpm test:e2e` smoke.
- **`projects-create.spec.ts`** — **serial** run that creates all **19** projects through the UI; use `pnpm test:e2e:projects`. Skills are ensured via API in `beforeAll`, not the 42-skill UI suite.

### Certifications fixture

Portfolio certifications for seed and E2E share one source of truth:

- `prisma/data/portfolio-certifications.json` — 49 certifications with `es`/`en`/`nl` titles
- `e2e/fixtures/portfolio-certifications.ts` — typed re-export for tests

`e2e/helpers/fill-certification-form.ts` fills the admin certification form via `#certification-*` IDs, toggles stack-type checkboxes, and optionally selects skills. `cleanupUserCertifications` clears all owner certifications before each run; `ensurePortfolioSkills` supplies missing fixture skills for the picker.

### Smoke vs full certifications suite

- **`certifications-smoke.spec.ts`** — creates **one** certification; included in `pnpm test:e2e` smoke.
- **`certifications-create.spec.ts`** — **serial** run that creates all **49** certifications; use `pnpm test:e2e:certifications`.

### Owner / register fixture

The primary portfolio user is shared between seed and e2e:

- `OWNER_USER_EMAIL` / `OWNER_USER_PASSWORD` in `.env.local` — credentials for register + login
- `prisma/data/portfolio-profile.json` — `name`, `username`, `displayName`, …
- `e2e/fixtures/portfolio-profile.ts` — typed re-export for tests

`e2e/helpers/fill-register-form.ts` drives `/register?next=/admin` via `#register-name`, `#register-username`, `#register-email`, `#register-password`, `#register-form-submit`. `ensureOwnerAccount()` tries sign-in first; if the user is missing, it completes registration through the UI (not `db:seed`).

### Smoke vs full register suite

- **`register-smoke.spec.ts`** — ensures owner exists (sign-in or register UI); included in `pnpm test:e2e` smoke.
- **`register-create.spec.ts`** — explicit register flow from the shared fixture; use `pnpm test:e2e:register`.

### Profile fixture

Portfolio home/profile content for seed and E2E share one source of truth:

- `prisma/data/portfolio-home.json` — hero summary, rotating titles, terminal steps, background image
- `prisma/data/portfolio-cv.json` — `aboutMe` paragraphs (home About section)
- `e2e/fixtures/portfolio-home.ts` — typed re-export for tests

`e2e/helpers/fill-profile-form.ts` drives `/admin/profile` (hero) and `/admin/profile/console` via `#profile-*` IDs. `cleanupUserProfile` clears hero titles, hero summary/background, and terminal steps only — it does not touch skills, projects, certifications, or CV list sections.

### Smoke vs full profile suite

- **`profile-smoke.spec.ts`** — saves **one** hero title + summary; included in `pnpm test:e2e` smoke.
- **`profile-create.spec.ts`** — **serial** run that fills hero (6 titles, 3 locales) and console (3 steps); use `pnpm test:e2e:profile`.

### Timeline fixture

Timeline entries for seed and E2E share one source of truth:

- `prisma/data/portfolio-timeline.json` — 9 items (study, work history, courses)
- `prisma/seed-portfolio-timeline.ts` — wipes and recreates owner timeline rows
- `e2e/fixtures/portfolio-timeline.ts` — typed re-export for tests

`e2e/helpers/fill-timeline-form.ts` drives `/admin/timeline/new` via `#timeline-*` IDs and locale tabs (`#timeline-lang-es|en|nl`). `cleanupUserTimeline` removes every owner timeline item via tRPC before each run.

### Smoke vs full timeline suite

- **`timeline-smoke.spec.ts`** — creates **one** timeline entry; included in `pnpm test:e2e` smoke.
- **`timeline-create.spec.ts`** — **serial** run that creates all **9** entries through the UI; use `pnpm test:e2e:timeline`.

### Soft skills fixture

Portfolio soft skills for seed and E2E share one source of truth:

- `prisma/data/portfolio-soft-skills.json` — section media (video/poster) + 8 items with icons and translations
- `prisma/seed-portfolio-soft-skills.ts` — wipes and recreates owner soft skills + section
- `e2e/fixtures/portfolio-soft-skills.ts` — typed re-export for tests

`e2e/helpers/fill-soft-skills-form.ts` drives `/admin/soft-skills/settings` and `/admin/soft-skills/new` via `#soft-skills-*` / `#soft-skill-*` IDs and locale tabs (`#soft-skill-lang-es|en|nl`). `cleanupUserSoftSkills` removes every owner soft skill item via tRPC before each run.

### Smoke vs full soft skills suite

- **`soft-skills-smoke.spec.ts`** — creates **one** soft skill; included in `pnpm test:e2e` smoke.
- **`soft-skills-create.spec.ts`** — **serial** run that saves section settings and creates all **8** items through the UI; use `pnpm test:e2e:soft-skills`.

### CV fixture

Portfolio CV for seed and E2E share one source of truth:

- `prisma/data/portfolio-cv.json` — header, about, contacts, education, languages, technical skills, experiences (with `skillKeys`), soft skills, additional info
- `e2e/fixtures/portfolio-cv.ts` — typed re-export for tests

`e2e/helpers/fill-cv-form.ts` drives the CV editor at `/admin/cv` using **stable `#cv-*` IDs only** (no label/role text queries): `#cv-section-modal`, `#cv-item-modal`, `#cv-locale-es|en|nl`, `#cv-header-form-submit`, `#cv-contact-type-option-PHONE`, `#cv-editor-preview`, `#cv-admin-preview`, etc. Add matching IDs when extending forms. `cleanupUserCv` clears list sections via tRPC before each run.

`e2e/helpers/verify-cv-preview.ts` asserts the rendered CV after save: admin **Preview** tab (`#cv-admin-preview`) and the public page at `/curriculum-vitae` (`#cv-public-preview`), using fixture strings for the owner’s `defaultLocale` from `portfolio-profile.json`.

Personal references in the fixture are seed-only (no admin UI yet) and are not part of the E2E create flow.

### Smoke vs full CV suite

- **`cv-smoke.spec.ts`** — creates **one** contact; included in `pnpm test:e2e` smoke.
- **`cv-create.spec.ts`** — **serial** run that rebuilds the full CV through the UI, then checks admin preview and the public `/curriculum-vitae` page; use `pnpm test:e2e:cv`.

### Owner user and CV fixture

The primary portfolio user is shared between seed and e2e:

- `OWNER_USER_EMAIL` / `OWNER_USER_PASSWORD` in `.env.local` — used by `pnpm db:seed` and Playwright login
- `prisma/data/portfolio-profile.json` — profile metadata (`username`, `displayName`, `photoUrl`, …)
- `prisma/data/portfolio-cv.json` — CV sections (header, experiences with `skillKeys`, etc.)
- `e2e/fixtures/portfolio-profile.ts` — typed re-export for tests

Playwright setup calls `ensureOwnerAccount()` (`e2e/helpers/fill-register-form.ts`): tries sign-in first, then fills `/register?next=/admin` from `portfolio-profile.json` + `OWNER_USER_*` env vars. Run `pnpm db:seed` when you need the full seeded portfolio, not only auth.

### Human navigation (required for new E2E specs)

E2E tests must follow **real user paths** through the UI. Do not deep-link with `page.goto()` into admin forms unless there is no clickable equivalent.

**Do**

- Start from a realistic entry point (e.g. `/admin` after auth setup).
- Use the **sidebar**, toolbar links, and buttons (`#skills-add`, `#projects-add`, `#certifications-add`, `#timeline-add`, `#soft-skills-add`, etc.) to reach each screen.
- Wait for the previous action to finish (mutation response, leave `/new`, list visible) before starting the next step.
- Use stable `inputId` / `#…` selectors on fields once the form is open.
- Use `page.goto()` only for exceptions: login page, initial `/admin` landing, or query params with no UI (e.g. `?perPage=100` to assert pagination).

**Do not**

- `page.goto("/admin/skills/new")` (or similar) as the default way to open create flows.
- Change app navigation (`router.push`, redirects) **only** to make tests pass — fix waits and user-like flows in `e2e/helpers/` instead.
- Fire the next `goto` or click while a tRPC mutation or `router.back()` from the prior save is still in flight.

**Reference implementations:**

- `e2e/helpers/fill-skill-form.ts` — `goToSkillsList()` (sidebar), `#skills-add`, fill form, wait for save, repeat.
- `e2e/helpers/fill-project-form.ts` — same pattern for projects; skill associations via `SkillPicker`.
- `e2e/helpers/fill-certification-form.ts` — certifications with type checkboxes and optional skill associations.
- `e2e/helpers/fill-timeline-form.ts` — timeline items via sidebar → `#timeline-add`.
- `e2e/helpers/fill-soft-skills-form.ts` — section settings via `#soft-skills-settings`, items via `#soft-skills-add`.
- `e2e/helpers/fill-cv-form.ts` — CV sections via nested modals and locale tabs (`#cv-locale-tabs`).

Reuse this pattern for services and CV sections.

**App code vs test code**

- Prefer `defaultValues` on forms and controlled inputs (`value ?? ""`) to fix real a11y/React warnings — that benefits users and tests.
- Keep post-save navigation consistent with the rest of admin (`router.back()` after create/edit) unless product UX explicitly requires otherwise.
