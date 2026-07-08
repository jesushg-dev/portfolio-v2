# Testing Guide

This project uses **Jest** (via `next/jest`), **Testing Library**, and **jsdom** for unit and component tests.

## Quick start

```bash
pnpm test           # run once
pnpm test:watch     # watch mode
pnpm test:coverage  # with coverage report
pnpm type-check     # also runs in CI alongside tests
```

CI runs on every push and pull request via [`.github/workflows/test.yml`](../.github/workflows/test.yml).

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
- [ ] Both `pnpm test` and `pnpm type-check` pass before pushing

## Current coverage (portfolio)

The first test suite targets the public portfolio routes under `src/app/[locale]/(portfolio)`:

- **Utilities:** `getLocalizedText`, certificate tab resolution, date formatting
- **CV components:** `education`, `languages`, `soft-skills`, `cv-preview`
- **Certificate components:** `certification-item`, `filter-type`, `certification`
- **Pages:** `curriculum-vitae/page`, `certificates/[[...slug]]/page`

Expand to admin, auth, and tRPC routers incrementally using the same patterns.

## E2E tests (Playwright)

End-to-end tests live in `e2e/` and use Playwright with a real dev server (`pnpm dev` on `http://localhost:3000`).

### Prerequisites

1. Copy `e2e/env.example` values into `.env.local` (gitignored):
   - `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` — credentials for an existing user in your test database
   - Optional `E2E_BASE_URL` (defaults to `http://localhost:3000`)
2. Install browsers once: `pnpm exec playwright install chromium`
3. The test DB should be reachable via your normal `.env` / `DATABASE_URL` when the dev server starts.

### Commands

| Script                          | What runs                                                              |
| ------------------------------- | ---------------------------------------------------------------------- |
| `pnpm test:e2e`                 | **Smoke** — login, dashboard, one skill + one project create           |
| `pnpm test:e2e:skills`          | Full **skills** suite — serial 42-skill create (`skills-create`)       |
| `pnpm test:e2e:skills:headed`   | Same as above with a visible browser (~3 min warm / longer on cold)    |
| `pnpm test:e2e:skills:ui`       | Playwright UI mode for the skills project                              |
| `pnpm test:e2e:projects`        | Full **projects** suite — serial 19-project create (`projects-create`) |
| `pnpm test:e2e:projects:headed` | Projects suite with visible browser                                    |
| `pnpm test:e2e:projects:ui`     | Playwright UI mode for the projects project                            |
| `pnpm test:e2e:ui`              | Playwright UI for all projects                                         |

Auth session is saved to `e2e/.auth/user.json` by `e2e/auth.setup.ts` (gitignored).

### Skills fixture

Portfolio skills for seed and E2E share one source of truth:

- `prisma/data/portfolio-skills.json` — 42 skills used by `prisma/seed.ts`
- `e2e/fixtures/portfolio-skills.ts` — typed re-export for tests

`e2e/helpers/fill-skill-form.ts` fills the admin skill form via stable `#skill-*` input IDs. `skills-cleanup.ts` removes fixture skills via tRPC before the full suite so runs stay idempotent when the DB was already seeded.

### Smoke vs full skills suite

- **`skills-smoke.spec.ts`** — creates **one** skill; fast enough for CI smoke (`pnpm test:e2e`).
- **`skills-create.spec.ts`** — **serial** run that creates all **42** skills through the UI; use `pnpm test:e2e:skills` locally or in a dedicated job. Expect a few minutes on a warm dev server; longer on cold start.

### Projects fixture

Portfolio projects for seed and E2E share one source of truth:

- `prisma/data/portfolio-projects.json` — 19 projects with translations and `skillKeys`
- `e2e/fixtures/portfolio-projects.ts` — typed re-export for tests

`e2e/helpers/fill-project-form.ts` fills the admin project form via `#project-*` IDs and selects associated skills through `SkillPicker` (`#skill-picker-*`). `ensure-portfolio-skills.ts` creates any missing fixture skills via tRPC before project tests (projects depend on skills existing for the picker). `cleanupUserProjects` removes fixture projects before each run.

### Smoke vs full projects suite

- **`projects-smoke.spec.ts`** — creates **one** project; included in `pnpm test:e2e` smoke.
- **`projects-create.spec.ts`** — **serial** run that creates all **19** projects through the UI; use `pnpm test:e2e:projects`. Skills are ensured via API in `beforeAll`, not the 42-skill UI suite.

### Human navigation (required for new E2E specs)

E2E tests must follow **real user paths** through the UI. Do not deep-link with `page.goto()` into admin forms unless there is no clickable equivalent.

**Do**

- Start from a realistic entry point (e.g. `/admin` after auth setup).
- Use the **sidebar**, toolbar links, and buttons (`#skills-add`, `#projects-add`, etc.) to reach each screen.
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

Reuse this pattern for services, certifications, and CV sections.

**App code vs test code**

- Prefer `defaultValues` on forms and controlled inputs (`value ?? ""`) to fix real a11y/React warnings — that benefits users and tests.
- Keep post-save navigation consistent with the rest of admin (`router.back()` after create/edit) unless product UX explicitly requires otherwise.
