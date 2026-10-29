# CV skills use the shared Skill catalogue

`CvTechnicalSkill` retains the category and category position. `CvTechnicalSkillSelection` links each group to real `Skill` records, with `visible` and `order`. There is no persisted CSV or copied technology-name array in the CV model.

The CV editor uses the canonical SkillPicker. The selected list supports drag handles and keyboard-accessible move buttons. Deselecting hides the relationship without deleting the Skill or its uses elsewhere. Changing a catalogue title is reflected in the CV because the title is resolved from Skill.

All standard exports, previews and tailored resume source documents use visible selections in saved category/item order. The AI can select a subset for a job, but the renderer preserves the selected items' CMS order. It cannot bring back hidden catalogue skills.

Imports and seeds resolve textual source names at their boundary into catalogue IDs. Existing exact/case-insensitive matches are reused, including the explicit aliases Tailwind → Tailwind CSS and Node-JS/NodeJS → Node.js. An absent catalogue entry can be created from the imported text; existing catalogue metadata is not overwritten. Editing the CV does not create catalogue entries: users select from their own Skill catalogue.

## Migration

```sh
pnpm db:generate
pnpm exec tsx prisma/scripts/migrate-cv-skill-catalog.ts
pnpm db:push
pnpm exec tsx prisma/scripts/migrate-cv-skill-catalog.ts --apply --expect-database=portfolio_prod
```

Review missing catalogue entries in the dry-run report before applying. Applying backs up all original groups, catalogue entries and selections to ignored `scratch/cv-skill-catalog-backups/`. It preserves group IDs, categories, item order and existing visibility settings. Groups with selections are not reselected on repeat runs.

After deploying the new code, retire the physical string arrays from the source collection:

```sh
pnpm exec tsx prisma/scripts/migrate-cv-skill-catalog.ts --apply --expect-database=portfolio_prod --purge-source-fields
```

The new code never reads those arrays. Cleanup is deferred until deployment so the previous deployed version can continue reading its original data during rollout.
