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

| Tailwind class          | CSS var              | Changes with theme |
| ----------------------- | -------------------- | ------------------ |
| `bg-background`         | `--background`       | ✅                 |
| `text-foreground`       | `--foreground`       | ✅                 |
| `bg-card`               | `--card`             | ✅                 |
| `bg-primary`            | `--primary`          | ✅                 |
| `bg-secondary`          | `--secondary`        | ✅                 |
| `bg-muted`              | `--muted`            | ✅                 |
| `text-muted-foreground` | `--muted-foreground` | ✅                 |
| `bg-accent`             | `--accent`           | ✅                 |
| `border-input`          | `--input`            | ✅                 |
| `border-border`         | `--border`           | ✅                 |
| `ring-ring`             | `--ring`             | ✅                 |
| `bg-popover`            | `--popover`          | ✅                 |
| `text-destructive`      | `--destructive`      | ✅                 |

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

## i18n — useTranslations

### ❌ NEVER mix multiple `useTranslations` namespaces in the same component

Mixing namespaces causes false positives in i18n plugins and type checkers.

```tsx
// ❌ WRONG — mixing namespaces in one component
const t = useTranslations("admin.forms.additional");
const tForms = useTranslations("admin.forms"); // ← second call
const tErrors = useTranslations("admin.errors"); // ← third call
```

### ✅ ALWAYS use exactly ONE `useTranslations` call per component

Each namespace must be **self-contained** — include every string the component needs (loading states, error messages, action labels) directly in that namespace's JSON file. Duplication in JSON is acceptable; mixing calls in code is not.

```tsx
// ✅ CORRECT — single namespace that owns all strings for this component
const t = useTranslations("admin.forms.additional");

// Accessing loading, errors, and actions all from the same namespace:
<p>{t("loading")}</p>
<p>{t("saveFailed")}</p>
<button>{t("save")}</button>
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
