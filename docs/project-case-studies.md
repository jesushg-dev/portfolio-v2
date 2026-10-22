# Project content

`ProjectTranslation.title` and `description` provide the project title and summary, including catalog search, metadata and next-project cards. Case-study narrative lives exclusively in `ProjectTranslation.caseStudy`.

Use `caseStudy.sections` for the challenge, approach and results. Each section owns its title, `lead` and items. Constraints are items of the challenge section. Metrics sections render their own `lead`, just like the other section kinds. Galleries and other structured content use `CaseStudyContentSchema`.

The project form preserves the complete case-study DTO when validating saves. Its narrative editor changes section titles and introductions without dropping gallery images, items or other section data.

## Existing MongoDB documents

Before deploying this model, run `pnpm db:projects:migrate` against the intended database to preview the number of translations to migrate. The default is read-only. Run `pnpm db:projects:migrate --apply` to apply the cutover before deploying and pushing the schema.

The migration preserves challenge, approach, outcome and constraints in canonical sections before removing the retired top-level fields. It merges text with existing leads, preserves gallery/items, validates all conversions before writing, and checks each source snapshot to avoid overwriting concurrent edits. It is safe to rerun after an interruption. `hook` is removed; `description` is the sole summary. Catalog highlights come from `caseStudy.tldr`. The unused embedded `stack` field is removed; project technologies continue to come from `ProjectSkill`.
