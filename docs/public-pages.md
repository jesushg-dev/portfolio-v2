# Public pages (Now, Uses, colophon, stats, process)

CMS-backed and static public routes besides the classic portfolio sections (home, skills, projects, CV, …).

## Ship flags

`src/lib/public-preview-pages.ts` — `PUBLIC_PAGE_LIVE`:

| Key        | Route       | Default in repo             |
| ---------- | ----------- | --------------------------- |
| `uses`     | `/uses`     | `false` (404 until flipped) |
| `now`      | `/now`      | `false`                     |
| `colophon` | `/colophon` | `true`                      |
| `stats`    | `/stats`    | `true`                      |

Metadata generators call the same helper so unpublished flags do not leak titles in the index. Flip a flag to `true` when the page is ready in production.

`isPublished` on **Profile** only gates the **CV** (`isPublicCvVisible`), not these routes.

## Now (`/now`)

Admin: `/admin/now` + focuses CRUD. Public loader: `getNowPageData` (`src/features/now/server/now-public.ts`).

Per tenant: timezone, status, reading, watched title, GitHub username/repo, photos, localized copy, and a list of **focuses**. GitHub contribution heatmap is computed client/server from `contrib-year.ts` (not a live GitHub scrape of private data).

Seed: `prisma/data/portfolio-now.json` (if present) / admin export entity `now`.

## Uses (`/uses`)

Admin: `/admin/uses`. Types: `EVERYDAY` | `SOFTWARE` | `BROWSER` plus workspace tags and media settings (`UsesSettings`).

Public page sections: everyday (image cards), software, browser, coding workspace, closing note. Markdown-ish links in copy go through `renderInlineMarkdownLinks`.

Seed/export entity `uses` → `portfolio-uses.json`.

## Colophon (`/colophon`)

Mostly static (`src/features/colophon/`): stack, type, palettes, logos, Website Carbon badge. Not a Prisma list. Still behind `PUBLIC_PAGE_LIVE.colophon`.

## Stats (`/stats`)

First-party analytics aggregates **without referrers**. See [`analytics.md`](./analytics.md).

## Process pages (`/process/[slug]`)

CMS pages with templates `WORKFLOW` | `QA`. Fields: slug unique per user, `isPublished`, `showInNav`, `navIcon`, per-locale JSON `content` + SEO/hero strings.

Public tRPC: `processPages.getBySlug` (published only), `processPages.listForNav` (`isPublished` + `showInNav`).

Admin: `/admin/process-pages` with a visual designer.

**Legacy URLs** (`/how-i-use-ai`, `/como-uso-ia`, `/qa-collaboration`, …) 301 via `src/features/process-pages/lib/legacy-process-page-redirects.ts` from `src/proxy.ts`.

Seed/export entity `processPages` → `portfolio-process-pages.json`.

## Other public routes (always on)

| Route                                                 | Notes                                                                            |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| `/` home                                              | Hero, about, skills, projects, services, contact                                 |
| `/curriculum-vitae`                                   | Gated by `isPublicCvVisible`                                                     |
| `/certificates`, `/projects/[slug]`, `/skills/[slug]` | CMS lists + intercepting skill modal                                             |
| `/schedule` (localized `/agendar`, `/plannen`)        | Calendly embed                                                                   |
| `/theme-customizer`                                   | Live theme playground                                                            |
| `/privacy`                                            | Legal copy; keep analytics section aligned with [`analytics.md`](./analytics.md) |
