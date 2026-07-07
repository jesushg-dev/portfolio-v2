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

| File / folder | Role |
|---------------|------|
| `setup.ts` | Global mocks loaded before every test (`next-intl`, `next/image`, `motion/react`) |
| `render-with-intl.tsx` | Wrapper around `render()` for components that call `useTranslations` |
| `fixtures/` | Shared mock data (e.g. `cv-data.ts`) |
| `mocks/` | Optional helpers for mocking tRPC or other clients |

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
      getLocalizedText({ default: "Hello", translations: { es: "Hola" } }, "es"),
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

| File | Purpose |
|------|---------|
| `jest.config.mjs` | `next/jest` wrapper, `jsdom`, `@/*` alias, `setupFilesAfterEnv` |
| `src/test-utils/setup.ts` | Global mocks and `@testing-library/jest-dom` matchers |

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
