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

**Component order in the file:** declare the parent that calls `useTranslations` / `getTranslations` **before** any same-file child that receives `t` as a prop. i18n editor plugins resolve namespaces top-to-bottom; if the child appears first, the plugin can mis-attribute keys. Use `function` declarations so the parent can sit above children that it renders.

**Page + `generateMetadata`:** split into separate files so each has its own single call, or keep metadata strings in the page namespace and extract the view to another file.

```tsx
// ✅ CORRECT — single namespace, single call
const t = useTranslations("admin.forms.additional");

<p>{t("loading")}</p>
<p>{t("saveFailed")}</p>
<button>{t("save")}</button>
```

```tsx
// ✅ CORRECT — hook parent first, child below receives t
export function Banner() {
  const t = useTranslations("admin.nudge");
  return <LocaleRow t={t} />;
}

function LocaleRow({ t, ... }: { t: ReturnType<typeof useTranslations<"admin.nudge">> }) {
  return <span>{t("saved")}</span>;
}
```

```tsx
// ❌ WRONG — child defined before the hook parent (breaks i18n editor plugins)
function LocaleRow({
  t,
}: {
  t: ReturnType<typeof useTranslations<"admin.nudge">>;
}) {
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

## tRPC admin routers — feature-based layout

Portfolio admin procedures live under `src/features/{domain}/server/*-admin.router.ts`, not in `src/server/api/routers/`.

| Namespace             | Router file                                                     |
| --------------------- | --------------------------------------------------------------- |
| `projectsAdmin`       | `features/projects/server/projects-admin.router.ts`             |
| `servicesAdmin`       | `features/services/server/services-admin.router.ts`             |
| `certificationsAdmin` | `features/certifications/server/certifications-admin.router.ts` |
| `skillsAdmin`         | `features/skills/server/skills-admin.router.ts`                 |
| `softSkillsAdmin`     | `features/soft-skills/server/soft-skills-admin.router.ts`       |
| `timelineAdmin`       | `features/timeline/server/timeline-admin.router.ts`             |
| `appLanguagesAdmin`   | `features/portfolio/server/app-languages-admin.router.ts`       |

Convention per domain: `getMine`, `createItem`, `updateItem`, `deleteItem`. Register new routers in `src/server/api/root.ts`.

### Router-only helpers — colocate, do not split

If helper functions/schemas are **only used by one tRPC router**, keep them **in that router file** (private `async function` / `const` schema at the top). Do not create a sibling `*-persist.ts`, `*-localized.ts`, or thin re-export adapter unless a **second** router or Server Component imports it.

```tsx
// ✅ CORRECT — persist helpers live in cv.router.ts
async function persistRequiredTextMap(db, map) {
  /* ... */
}

// ❌ WRONG — cv-localized-persist.ts imported only by cv.router.ts
```

## Admin forms — DTOs, queries, and direct mutations

Portfolio admin forms follow a **single-shape, no double-mapping** architecture. Reference implementation: `certifications`.

### Layer responsibilities

| Layer                  | Location                                     | Purpose                                                                   |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| Types + Prisma mappers | `features/{domain}/lib/*-editor-dto.ts`      | `*EditorDTO`, `*CreateFormDTO`, `map*ToEditorDto`, `buildEmpty*CreateDto` |
| Server page queries    | `features/{domain}/server/*-queries.ts`      | Auth, DB fetch, map to DTO; used by RSC pages only                        |
| tRPC router            | `features/{domain}/server/*-admin.router.ts` | Mutations + `getMine`; imports mappers from `lib/*-editor-dto.ts`         |
| Client form            | `features/{domain}/components/*-form.tsx`    | Zod + react-hook-form; receives `initialData` from server                 |

Shared auth helper: `src/lib/admin/get-authenticated-user-id.ts`.

### ❌ NEVER add pass-through mappers

Do **not** create helpers whose only job is reshaping data the form already has:

```tsx
// ❌ WRONG — pointless indirection
export function toProjectMutationData(values, mode) {
  return { image: values.image, type: values.type, ... };
}
await createProject.mutateAsync(toProjectMutationData(values, "create"));

// ❌ WRONG — separate DB + auth boilerplate in every page
const session = await auth.api.getSession({ headers: await headers() });
const project = await db.project.findUnique({ ... });
const editorDto = mapProjectToEditorDto(project, languages);

// ❌ WRONG — normalizeOptionalString / toFormOptionalString round-trips
githubUrl: normalizeOptionalString(values.githubUrl, "create");
```

### ✅ CORRECT — one DTO shape end-to-end

1. **Mapper in `lib/*-editor-dto.ts`** outputs the same shape the form uses (`url: certification.url ?? ""`, not `string | null`).
2. **Query in `server/*-queries.ts`** encapsulates page data loading:

```tsx
// features/certifications/server/certification-queries.ts
export async function getCertificationEditorDto(id: string) {
  /* auth + db + map */
}
export async function buildCertificationCreateDto() {
  /* empty create DTO */
}
export async function getUserCertificationsWithLanguages() {
  /* list page */
}
```

3. **Page stays thin** — one `Promise.all` for translations + page data; list pages call `setRequestLocale` first:

```tsx
const { locale } = await params;
setRequestLocale(locale as Locale);
const [t, { initialData, languages }] = await Promise.all([
  getTranslations("admin.certifications"),
  getCertificationCreatePageData(),
]);
```

4. **No wrapper helpers** — call `buildEmptyTranslationMap` / `mergeTranslationMap` directly; do not add `createEmptyTitleDescriptionTranslationMap`, `createEmptyTextTranslationMap`, `mergeProjectTranslationMap`, or `getAppLanguages` indirection layers. Use `db.appLanguage.findMany({ orderBy: { code: "asc" } })` inline in queries and routers. Keep `localized-text-map.ts` only for Prisma JSON ↔ text-map conversions (`localizedJsonToTextMap`, `textMapToLocalizedJson`), not empty-map factories.

5. **Form submits values directly** — coerce optional fields with `?? undefined` (not `=== "" ? undefined`), and dates inline in `onSubmit` when tRPC expects `Date`:

```tsx
const data = {
  ...values,
  url: values.url ?? undefined,
};
await createCert.mutateAsync(data);
```

6. **Create/edit page data** lives in `get*CreatePageData()` / `get*EditPageData()` — each returns `{ initialData | editorDto, languages }` in one call; never export separate `get*Languages()` or duplicate language fetches in the page.

### Form component contract

- Props: `initialData: *EditorDTO | *CreateFormDTO` (required) + `languages`
- Edit mode: `"id" in initialData` — not `Boolean(initialData)` or optional `initialData?`
- `defaultValues: initialData as TForm` + `useLocalizedForm({ buildDefaultValues: () => initialData as TForm, resourceId: "id" in initialData ? initialData.id : undefined })`
- Never import `features/*/server/*` from `"use client"` files

### Timeline exception

When the form shape differs from the list/API DTO (date strings, `{ url }[]` images), define `TimelineFormDTO` in `lib/timeline-editor-dto.ts` and expose `mapTimelineToFormDto` + `getTimelineFormDto` in queries. Still no client-side Prisma mappers.

## i18n — editor rows vs display locale

Do not mix form/editor concerns with list display in one module.

| Module                              | Purpose                                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/lib/i18n/editor-rows.ts`       | `LanguageRef` — shared app-language reference type                                                        |
| `src/lib/i18n/translation-map.ts`   | `TranslationMap`, `mergeTranslationMap`, `buildEmptyTranslationMap` — form/editor translation maps        |
| `src/lib/i18n/localized-display.ts` | `getTitleDescriptionForLocale`, `getLocalizedFieldForLocale` — resolve text for active UI locale in lists |
| `src/lib/i18n/localized-form.ts`    | Zod map schemas (`translationMapSchema`) and completeness for admin forms                                 |

## Admin create/edit pages — server-built `initialData`

Never pass inline helpers like `defaultTranslations={emptyXTranslations(languages)}` in JSX. Never leave create forms without `initialData`.

**Create (Server Component):**

```tsx
const [t, { initialData, languages }] = await Promise.all([
  getTranslations("admin.projects"),
  getProjectCreatePageData(),
]);

<ProjectForm initialData={initialData} languages={languages} />;
```

**Edit:** `getProjectEditPageData(id)` returns `{ editorDto, languages } | null` in one call.

Forms accept `initialData: EditorDTO | CreateFormDTO` only — no separate `defaultTranslations` prop. Use `"id" in initialData` for edit vs create mode.

## Dynamic edit routes — form remount (`[id]/edit`)

When generating or modifying a Server Component page that renders a client form with `initialData` from a dynamic route (`app/**/[id]/edit/page.tsx` or similar):

1. **Always** pass `key={item.id}` (or `key={id}`) to the client form so React remounts when switching items without leaving the layout. Do not assume navigation alone remounts the form within the same dynamic segment.
2. If the form uses `react-hook-form`, avoid static `defaultValues` derived from props that can change without remount. Prefer `defaultValues` as a function (sync or async) or a defensive `useEffect` with `form.reset()` tied to the resource id, in addition to `key`.
3. For multilanguage fields, do not conditionally unmount inactive language `FormField`s — hide them with CSS to preserve focus and scroll when switching tabs.
4. Apply this to all portfolio admin forms with the same pattern: CvExperience, CvEducation, CvHeroTitle, Project, Service, Certification, TimelineItem, PortfolioSoftSkill.

## Multilanguage normalization lives in the backend (tRPC), not the client

1. No function that transforms between Prisma `Json` shape (`{ default, translations }`) and form shape may be imported in a `"use client"` file. Code under `features/*/server/` must only be imported from tRPC routers, route handlers, or Server Components.
2. tRPC procedures (`getMine`, `createItem`, `updateItem`, etc.) expose/receive editor DTOs ready for forms (`translations` as a `TranslationMap`, not raw Prisma `Json`). Mapping to/from Prisma happens in the router mutation or in `lib/*-editor-dto.ts` mappers.
3. **Prisma ↔ DTO mappers live in `features/{domain}/lib/*-editor-dto.ts`**, not in `server/*-editor.ts`. Page-specific DB + auth orchestration lives in `features/{domain}/server/*-queries.ts`. Do not split the same mapper across both files.
4. List/table display must resolve text for the **active UI locale** (`getTitleDescriptionForLocale`, `getSoftSkillTranslationText`, etc.) — never hardcode `translations[0]`.

## Admin multilanguage forms — `useLocalizedForm`

For admin forms with a `translations` map and `GlobalLanguageSelector`, use the shared hook instead of duplicating `activeLangId` state and reset-on-`resourceId` logic.

| Layer                                  | Location                                      |
| -------------------------------------- | --------------------------------------------- |
| Pure helpers (rows, completeness, Zod) | `src/lib/i18n/localized-form.ts`              |
| Client hook                            | `src/hooks/admin/use-localized-form.ts`       |
| Feature form                           | `src/features/{domain}/components/*-form.tsx` |

1. Build create/edit data via `get*CreatePageData()` / `get*EditPageData()` from `*-queries.ts`. Pass the full object as `initialData`; never assemble translation rows in `"use client"` or pass a separate `defaultTranslations` prop.
2. Pass `resourceId: "id" in initialData ? initialData.id : undefined` so the hook resets when navigating between `[id]/edit` routes (in addition to `key={id}` on the page).
3. Use `translationMapSchema` / `titleDescriptionTranslationMapSchema` in the Zod schema instead of inline `superRefine` blocks.
4. Optional: pass `completenessFields` and `copyFields` to wire `statusByLangId` and `copyFieldsFromPrimary` on `GlobalLanguageSelector`.
5. Do **not** put the hook inside a feature folder — it is cross-feature admin infrastructure. Forms with a different shape (e.g. `profile-hero-form`, per-locale record maps) keep their own logic.
6. Never import `features/*/server/*` from `"use client"` files; `initialData` arrives from Server Component pages only.
