# Shared admin forms

Admin create/edit dialogs share layout primitives so lists stay consistent and Playwright can target stable IDs.

## Building blocks

| Module | Role |
| --- | --- |
| `src/components/shared/form-root.tsx` | `FormRoot` / `FormContent` / compact `FormItem` (label + description + control + message) |
| `src/components/shared/form-dialog-content.tsx` | Modal chrome for intercepting `@modal` routes |
| Feature `*-form.tsx` | Fields, zod schema, tRPC mutation |

Pattern:

```tsx
<FormRoot>
  <FormContent>
    <FormField
      control={form.control}
      name="title"
      render={({ field }) => (
        <FormItem label={t("title")} description={t("titleHint")}>
          <Input id="skill-title" {...field} />
        </FormItem>
      )}
    />
  </FormContent>
</FormRoot>
```

Use `defaultValues` and `value={field.value ?? ""}` so inputs are controlled and a11y-clean.

## IDs

E2E helpers query `#skill-*`, `#project-*`, `#certification-*`, `#timeline-*`, `#soft-skill-*`, `#cv-*`, `#profile-*`, `#register-*`. Add a matching `id` when you add a field. See [`testing.md`](./testing.md) (human navigation).

## Locale tabs

Localized CMS fields use language tabs (`#cv-locale-es`, `#timeline-lang-en`, …) writing into translation maps, not separate routes.
