# Portfolio v2 — Agent Rules

## Theming System

This project uses a **`data-theme` attribute system** for theming, NOT Tailwind's `dark:` variant.

### ❌ NEVER use `dark:` classes in `src/components/ui/`

```tsx
// ❌ WRONG — dark: will NEVER activate in this project
className = "bg-background dark:bg-input/30 dark:hover:bg-input/50";

// ✅ CORRECT — semantic tokens update automatically with data-theme
className = "bg-background";
```

### Why

The available themes are: `main-light`, `main-dark`, `orange-light`, `orange-dark`, `christmas-light`, `christmas-dark`.

They are applied as a `data-theme="..."` attribute on the root element, **not** via `.dark` class or `prefers-color-scheme` media query.

Tailwind's `dark:` variant is bound to one of those two mechanisms — **neither is used here**.

The `@theme` block in `src/app/globals.css` contains a semantic color bridge:

```css
@theme {
  --color-background: var(--background);
  --color-primary: var(--primary);
  /* ... */
}
```

And each `[data-theme="..."]` block in `@layer base` overrides the raw color scales (`--color-primary-*`, `--color-background-*`, etc.), which flow up through `--primary`, `--background`, etc. into the Tailwind utility classes.

**This means semantic tokens like `bg-primary`, `text-foreground`, `bg-muted`, `border-input`, `bg-card` etc. already change correctly across all themes without any `dark:` qualifier.**

### Pre-commit enforcement

A Husky `pre-commit` hook runs `lint-staged` on every commit.
Any staged file in `src/components/ui/**/*.{ts,tsx}` that contains a `dark:` class will **fail the commit** with a descriptive error message.

### Semantic token reference

| Tailwind class            | CSS var                | Changes with theme |
| ------------------------- | ---------------------- | ------------------ |
| `bg-background`           | `--background`         | ✅                 |
| `text-foreground`         | `--foreground`         | ✅                 |
| `bg-card`                 | `--card`               | ✅                 |
| `text-card-foreground`    | `--card-foreground`    | ✅                 |
| `bg-primary`              | `--primary`            | ✅                 |
| `text-primary-foreground` | `--primary-foreground` | ✅                 |
| `bg-secondary`            | `--secondary`          | ✅                 |
| `bg-muted`                | `--muted`              | ✅                 |
| `text-muted-foreground`   | `--muted-foreground`   | ✅                 |
| `bg-accent`               | `--accent`             | ✅                 |
| `border-input`            | `--input`              | ✅                 |
| `border-border`           | `--border`             | ✅                 |
| `ring-ring`               | `--ring`               | ✅                 |
| `bg-popover`              | `--popover`            | ✅                 |
| `text-destructive`        | `--destructive`        | ✅                 |

### Two color systems — know which to use

This project has **two** related color layers. Mixing them incorrectly is the #1 cause of unreadable text in dark themes.

#### 1. Shadcn semantic tokens (preferred for new code & `src/components/ui/`)

Classes like `text-foreground`, `bg-card`, `text-muted-foreground`, `border-input`.

Defined in `:root` inside `src/app/globals.css` as aliases to the palette, e.g.:

```css
:root {
  --foreground: var(--color-primaryText-500);
  --card: var(--color-background-50);
  --card-foreground: var(--color-primaryText-500);
}
```

Because they reference `--color-*` variables, they **automatically track** the active `[data-theme="..."]` block. Use these for:

- Shadcn UI components (`Input`, `Label`, `Button`, …)
- Admin forms and any new surface
- Text that must contrast with `bg-card` / `bg-background`

#### 2. Legacy palette scales (portfolio sections only)

Classes like `text-primaryText-500`, `bg-background-50`, `text-secondaryText-50`.

These are the raw `--color-primaryText-*`, `--color-background-*` scales declared in `@theme` and overridden per `[data-theme]`. They also change with theme, **but**:

- They are **not** the same API Shadcn components expect
- Hard-coding a shade like `text-primaryText-900` for headings while labels inherit browser default black → broken contrast in dark mode
- Never use undefined CSS vars like `var(--background-50)` — the correct name is `var(--color-background-50)` or, preferably, the Tailwind class `bg-card`

**Rule of thumb:** if you are touching `src/components/ui/` or a form, use semantic tokens only. Legacy `primaryText-*` / `background-*` may remain in older portfolio feature components until migrated.

### Installing Shadcn / third-party UI components

After `pnpm dlx shadcn@latest add <component>`, **always** post-process the generated files:

1. **Remove every `dark:` class** — they never activate; our themes use `data-theme`, not `.dark`.
2. **Replace hardcoded neutrals** (`text-zinc-900`, `bg-white`, `dark:text-white`, etc.) with semantic tokens (`text-foreground`, `bg-card`, `border-border`, …).
3. **Replace `framer-motion` imports** with `motion/react` (see Animation Libraries below).
4. **Ensure `Label` / form text** includes `text-foreground` (our `label.tsx` already does — do not remove it).
5. **Prefer existing primitives** from `@/components/ui/` (`Input`, `Textarea`, `Button`) instead of raw `<input>` with hand-rolled colors.
6. **Do not add** `className="dark:..."` workarounds — fix the token, not the variant.

Generated Shadcn snippets assume the default `.dark` class strategy. This project is **not** that setup.

### Surfaces & text inheritance

When building a card or panel, set **both** background and foreground on the container so children inherit theme-aware text:

```tsx
// ✅ CORRECT — children inherit readable text in every theme
<div className="bg-card text-card-foreground rounded-sm p-6">
  <h2 className="text-foreground font-bold">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>

// ❌ WRONG — bg without text color; labels inherit browser default (often black)
<div className="bg-background-50 rounded-sm p-6">
  <label>Name</label>
</div>
```

## Animation Libraries

This project has migrated to the official `motion` package.

### ❌ NEVER use `framer-motion` imports

```tsx
// ❌ WRONG
import { motion, AnimatePresence } from "framer-motion";
```

### ✅ ALWAYS use `motion/react`

```tsx
// ✅ CORRECT
import { motion, AnimatePresence } from "motion/react";
```

When generating components (like Aceternity UI), automatically fix the imports to use `motion/react`.

## Forms Architecture

This project uses a unified form architecture based on Shadcn UI and a custom `form-root.tsx` wrapper to enforce consistency, accessibility, and DRY principles.

### ✅ ALWAYS use `FormRoot`, `FormSection`, and `FormContent` for form layouts

```tsx
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";

// ✅ CORRECT — Using unified wrappers
<Form {...form}>
  <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
    <FormContent error={submit.error}>
      <FormSection title="General">{/* Fields */}</FormSection>
    </FormContent>
    <FormActions isPending={isPending} title="Save">
      <button type="button" onClick={() => router.back()}>
        Cancel
      </button>
    </FormActions>
  </FormRoot>
</Form>;
```

### ❌ NEVER use raw HTML forms or raw labels

```tsx
// ❌ WRONG — Do not use raw form elements
<form onSubmit={...}>
  <div className="flex flex-col gap-2">
    <label>Name</label>
    <input />
  </div>
</form>
```

### Form Fields

Always use Shadcn UI's `<FormField>` in combination with our custom `<FormItem>`.

```tsx
// ✅ CORRECT — Using FormField with custom FormItem
<FormField
  control={form.control}
  name="title"
  render={({ field }) => (
    <FormItem label="Title" description="Optional description">
      <Input {...field} />
    </FormItem>
  )}
/>
```

## Strict Typing

This project requires strict TypeScript typing.

### ❌ NEVER use `any` to "fix" type errors

```tsx
// ❌ WRONG — Casting to `any` just hides the problem
const value = (e.target as any).value;
<Select onValueChange={(val: any) => setVal(val)} />;
```

### ✅ ALWAYS use proper types

```tsx
// ✅ CORRECT — Use exact types
const value = (e.target as HTMLInputElement).value;
<Select onValueChange={(val: string) => setVal(val)} />;
```

Type errors are there for a reason. Using `any` defeats the purpose of TypeScript and introduces potential runtime errors. Resolve type errors properly by defining correct interfaces, type guards, or extracting the proper types from libraries.

## ESLint & TypeScript Errors

### ❌ NEVER turn off warnings or errors

Never disable ESLint rules or turn warnings/errors to `off` or `warn` in `eslint.config.js` or via inline comments just to bypass them.

### ✅ ALWAYS fix the underlying issues

When asked to fix linting or type-checking errors, you must fix the actual code. If there are 400 errors, you must resolve them by writing proper types, refactoring unsafe assignments, and updating the code logic. Disabling the rule is strictly prohibited.

## i18n — useTranslations / getTranslations

### ❌ NEVER call `useTranslations` or `getTranslations` more than once per file

Multiple calls in the same file break i18n editor plugins and type checkers. This applies to **the entire file** — including helper components, subcomponents, and `generateMetadata` in the same module.

```tsx
// ❌ WRONG — two namespaces in one file
const t = useTranslations("admin.forms.additional");
const tActions = useTranslations("admin.actions"); // ← second call in same file

// ❌ WRONG — page + generateMetadata each calling getTranslations
export default async function Page() {
  const t = await getTranslations("curriculum");
}
export async function generateMetadata() {
  const t = await getTranslations("curriculum"); // ← second call in same file
}
```

### ✅ ALWAYS use exactly ONE translation call per file

Each namespace must be **self-contained** — include every string the file needs (loading states, error messages, action labels) directly in that namespace's JSON file. Duplication in JSON is acceptable; multiple calls in code is not.

**Same file, multiple components:** call the hook once in the parent and pass `t` (or pre-translated strings) to child components defined in that file.

**Page + `generateMetadata`:** split into separate files so each has its own single call, or keep metadata strings in the page namespace and extract the view to another file.

```tsx
// ✅ CORRECT — single namespace, single call
const t = useTranslations("admin.forms.additional");

<p>{t("loading")}</p>
<p>{t("saveFailed")}</p>
<button>{t("save")}</button>
```

```tsx
// ✅ CORRECT — child in same file receives t from parent
function LocaleRow({ t, ... }: { t: ReturnType<typeof useTranslations<"admin.nudge">> }) {
  return <span>{t("saved")}</span>;
}

export function Banner() {
  const t = useTranslations("admin.nudge");
  return <LocaleRow t={t} />;
}
```

## Mutation Handlers — useCallback + useTransition

### ❌ NEVER write async mutation logic inline in JSX props

Inline handlers are untestable, hard to read, and miss transition semantics.

```tsx
// ❌ WRONG — inline async mutation in JSX prop
<ExperienceForm
  onSubmit={async (input) => {
    await create.mutateAsync(input);
    await utils.cv.getMine.invalidate();
  }}
/>
```

### ✅ ALWAYS extract handlers to named `useCallback` + `useTransition`

Every mutation handler must be a named `useCallback` that wraps async work in `startTransition`.

```tsx
// ✅ CORRECT
const [isPending, startTransition] = useTransition();

const handleSubmit = useCallback(
  (input: ExperienceInput) => {
    startTransition(async () => {
      setServerError(null);
      try {
        if (editingId) {
          await update.mutateAsync({ id: editingId, ...input });
          setEditingId(null);
        } else {
          await create.mutateAsync(input);
          setCreating(false);
        }
        await utils.cv.getMine.invalidate();
      } catch (err) {
        setServerError(err instanceof Error ? err.message : t("saveFailed"));
      }
    });
  },
  [editingId, update, create, utils, t],
);

// In JSX — clean and readable
<ExperienceForm onSubmit={handleSubmit} />;
```

This rule applies to ALL handlers: `handleSubmit`, `handleDelete`, `handleReorder`, etc.

## Unit Testing

This project uses **Jest** with `next/jest`, **Testing Library**, and **jsdom**. See [`docs/testing.md`](../docs/testing.md) for the full guide.

### File placement — co-locate tests

### ✅ ALWAYS place test files next to the code they cover

```
src/components/curriculum-vitae/
  education.tsx
  education.test.tsx        ← same folder

src/lib/i18n/
  localized.ts
  localized.test.ts
```

### ❌ NEVER mirror the entire `src/` tree under a top-level `tests/` folder

A parallel `tests/components/...` structure drifts out of sync, especially with App Router route groups `(portfolio)` and catch-all segments `[[...slug]]`. Keep unit tests co-located; centralize only shared infrastructure.

### Shared test infrastructure lives in `src/test-utils/`

| Path                                  | Purpose                                                  |
| ------------------------------------- | -------------------------------------------------------- |
| `src/test-utils/setup.ts`             | Global mocks (`next-intl`, `next/image`, `motion/react`) |
| `src/test-utils/render-with-intl.tsx` | Render helper for components using `useTranslations`     |
| `src/test-utils/fixtures/`            | Reusable mock data (e.g. CV fixtures)                    |
| `src/test-utils/mocks/`               | Optional per-domain mock helpers (e.g. tRPC)             |

### Naming and discovery

- File pattern: `*.test.ts` or `*.test.tsx`
- Jest config: `jest.config.mjs` (via `next/jest`)
- Run: `pnpm test`, `pnpm test:watch`, `pnpm test:coverage`

### What to test and how

| Layer                       | Approach                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| Pure utilities              | Direct `describe`/`it` — no DOM                                                                          |
| Presentational components   | `renderWithIntl()` + Testing Library queries                                                             |
| Client components with tRPC | `jest.mock("@/trpc/react", …)` in the test file                                                          |
| App Router pages (RSC)      | Smoke tests: mock `next-intl/server`, Prisma, tenant; invoke the async page export and render the result |
| E2E (future)                | Separate `e2e/` folder with Playwright — not mixed with unit tests                                       |

### ✅ ALWAYS extract testable pure logic from components

If inline logic is worth testing (e.g. slug → tab index, date formatting), move it to a sibling `.ts` file and unit-test that file directly.

### ❌ NEVER disable tests or skip type-checking in CI to make tests pass

Fix mocks, types, and fixtures properly. Both `pnpm test` and `pnpm type-check` run in CI (`.github/workflows/test.yml`).
