# Blog refinement and Nicaragua tutorial draft

Work is isolated on `codex/blog-monitor-tutorial`, based on `feat/blog` at
`809be7c5867e0027bb157b25d61adbc7f1f27634`. No merge, push, publication, or database
write has been performed. The admin redesign checkout was not edited.

## Blog changes

- Search now queries the server instead of only inspecting loaded cards.
- Pagination uses the last displayed record as a Prisma cursor with stable ordering.
- Tag options come from published posts and use the canonical public pill tabs.
- Empty and error results retain the filters; loading failures offer a retry.
- Cards remain visible with reduced motion; series metadata stays out of tag badges.
- Reading time counts document text rather than serialized JSON keys and URLs.
- Repeated and punctuation-only headings get unique anchors shared with the renderer.
- The contents list responds when headings mount and tracks scroll position.
- Tiptap disables duplicate Link registration and defers editor creation for Next.js.
- The editor uses the article typography and syncs external content without emitting edits.
- The lockfile includes the dependencies already declared by the original blog branch.

## Editorial draft

`prisma/data/blog-drafts/monitor-titulo-la-gaceta-nicaragua.es.json` is a Spanish-only
Tiptap document with `status: DRAFT` and `publishedAt: null`. It teaches a small monitor
from scratch, includes complete JavaScript and workflow code, and explains the parser,
state comparison, Telegram request, cache, failure behavior, and customization.
The author's repository is an optional reference at the end, not a prerequisite.

Copyable source files also live in `content/blog-examples/title-publication-monitor/`.
They are outside `.github/workflows`, so they do not schedule anything in this project.
For a reader's separate repository, their destinations are `scripts/check-title.mjs`
and `.github/workflows/monitor-title.yml`.

The example tracks one exact registry and alerts on first observation or changed fields.
It deliberately has no name matching or estimated publication dates. Its dry run queries
La Gaceta but neither sends Telegram nor changes local state. Its YAML uses a daily
Monday-to-Saturday schedule chosen for the tutorial, not the original monitor's six runs.

The source HTML mapping was reviewed against monitor commit
`9f3816b3e720cf9e98915b866d5717df77655f5c`. The new example has not been exercised
against La Gaceta or a real Telegram bot. Keep the article in draft until those checks
and editorial review are complete.

## Optional draft import, after review

The following default command only reads and validates the local draft. It does not
connect to a database:

```sh
node scripts/import-blog-draft.mjs
```

Only when targeting the intended database and exact existing owner account:

```sh
node scripts/import-blog-draft.mjs --write --email owner@example.com
```

The explicit write creates one Spanish draft using relational translations, does not
delete other posts, and preserves any existing post with the same owner and slug.
It does not create owners or languages. No translations have been invented.
Do not use the full existing portfolio seed just to load this article: that seed deletes
and recreates the owner's blog posts.

## Validation status and suggested user checks

The user will run tests. Do not interpret these changes as verified by a passing suite.
The first Jest attempt discovered zero tests because of Windows path handling in this
worktree. The subsequent command was not run, at the user's request. No lint, type check,
build, browser verification, live La Gaceta query, or Telegram send was performed.
Prisma generation succeeded using a placeholder local URI, without connecting to MongoDB.
The initial draft importer dry run succeeded before the article was rewritten.

For the focused Jest suites, use explicit path patterns if the default config discovers
zero tests under `.codex/worktrees`:

```sh
pnpm exec jest --runTestsByPath src/features/blog/lib/blog-headings.test.ts src/features/blog/server/blog-public.router.test.ts --testMatch '**/src/**/*.test.ts' --testPathIgnorePatterns '/node_modules/' --runInBand
```

Review in the browser: reduced motion, an empty tag result followed by clearing filters,
search for a post beyond the first page, repeated heading links, mobile code scrolling,
and editor loading and external content resets. Exercise pagination with publication
dates that differ from creation order and with equal dates.

For the tutorial, confirm an exact registry against the official page, exercise the
dry run, confirm one real Telegram send, rerun unchanged, and confirm cache restoration
in a separate repository. Keep real credentials out of code and shared logs.
