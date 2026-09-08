# Seed data and JSON export

Portfolio content is checked in as JSON under `prisma/data/` and loaded by `pnpm db:seed` (`prisma/seed.ts`). Admin can export the **current user’s** CMS rows back to the same filenames.

## Seed (operator / e2e)

Requires `OWNER_USER_EMAIL` and `OWNER_USER_PASSWORD` in `.env.local`.

Order (see `prisma/seed.ts`): languages → primary user/profile (`seed-portfolio-user.ts`) → skills, projects, certifications, services, timeline, soft skills, home/hero, CV, now/uses/process pages as each seeder exists.

Idempotent: user/profile/header upsert; list sections typically `deleteMany` + `create` for that `userId`.

| Fixture                                                                       | Typical seeder                                                     |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `portfolio-profile.json`                                                      | `seed-portfolio-user.ts`                                           |
| `portfolio-home.json`                                                         | hero / terminal                                                    |
| `portfolio-cv.json`                                                           | `seed-portfolio-cv.ts` (includes `skillKeys`, personal references) |
| `portfolio-skills.json`                                                       | skills                                                             |
| `portfolio-projects.json`                                                     | projects                                                           |
| `portfolio-certifications.json`                                               | certifications                                                     |
| `portfolio-timeline.json`                                                     | `seed-portfolio-timeline.ts`                                       |
| `portfolio-soft-skills.json`                                                  | `seed-portfolio-soft-skills.ts`                                    |
| `portfolio-now.json` / `portfolio-uses.json` / `portfolio-process-pages.json` | matching seeders when present                                      |

Locale maps in those files must include `en`, `es`, `nl` (`localized-completeness.test.ts`).

Playwright does **not** require a full seed for login: `ensureOwnerAccount()` registers via UI if needed. Run seed when you want fixture content.

## Admin export

tRPC `portfolioSeedExport.*` (`src/features/portfolio/server/seed-export/`). All procedures are `protectedProcedure` and filter by `ctx.user.id`.

Entities (`src/lib/seed-export/entities.ts`): skills, projects, services, certifications, timeline, softSkills, uses, now, processPages.

UI: `ExportSeedJsonButton` on each list (single JSON) or zip `portfolio-seed.json.zip`.

Re-import is **manual**: replace `prisma/data/<file>.json` and re-seed, or paste into admin forms. There is no “upload JSON to overwrite production” endpoint on purpose.

## Auth identity in seed

Seeded credential accounts must set Better Auth 1.7 `issuer` the same way as sign-up (`src/lib/auth-account-issuer.ts`). See [`auth-security.md`](./auth-security.md).
