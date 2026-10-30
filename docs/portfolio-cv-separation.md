# Public profile and CV ownership

- `/admin/profile` reads and writes `PortfolioHeader` and `PortfolioHeaderTranslation`: public name/photo/background, hero subtitle/tagline/summary, public availability, image alternative text and public About narrative.
- `/admin/cv` reads and writes `CvHeader`, `CvHeaderTranslation`, `CvAboutMe` and the remaining CV records. Its professional title, summary, photo and availability are independent of the public profile.
- Resume import updates CV records only. All CV exports and previews use only the CV summary; they never fall back to hero text.
- Home seeds write public profile records. CV seeds write CV records. Resetting or reseeding the CV does not delete or overwrite public hero content.

## Data migration

Generate Prisma, then run the dry run:

```sh
pnpm db:generate
pnpm exec tsx prisma/scripts/separate-portfolio-profile.ts
```

Against the intended database, create the new collections/indexes and copy the existing profile data:

```sh
pnpm db:push
pnpm exec tsx prisma/scripts/separate-portfolio-profile.ts --apply --expect-database=portfolio_prod
```

The script saves a complete backup of the source headers/translations and existing public records under ignored `scratch/portfolio-profile-backups/`. Existing public records are not overwritten. CV records and their counts are retained.

After deploying the new code, remove the source-only hero fields from the old MongoDB documents:

```sh
pnpm exec tsx prisma/scripts/separate-portfolio-profile.ts --apply --expect-database=portfolio_prod --purge-source-fields
```

The source fields have already been removed from the Prisma CV schema and are never read by the new application. Physical cleanup is deferred until deployment because the previous deployed version still uses them. This is a migration step, not a runtime compatibility path.
