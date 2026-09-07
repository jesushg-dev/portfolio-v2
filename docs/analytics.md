# Analytics

First-party pageview stats per tenant. No third-party tracker.

## What is collected

Each accepted beacon upserts `AnalyticsDailyStat` (`prisma/schema/analytics.prisma`) on unique:

`(userId, UTC date, path, country, referrerHost)`

| Field                  | Source                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `userId`               | Tenant from **Host** (apex → primary owner). Username headers are not trusted.                                       |
| `path`                 | Client pathname, normalized by `toAnalyticsPath` (locale stripped, max 180 chars). Admin/auth/API paths are dropped. |
| `country`              | `x-vercel-ip-country` (ISO-2) or `XX`                                                                                |
| `referrerHost`         | Hostname from `document.referrer`, or `direct`                                                                       |
| `pageviews` / `visits` | +1 pageview always; +1 visit when the client sends `isNewVisit` (sessionStorage flag)                                |

Retention: ~2% of writes prune rows older than the cutoff in `utcDay.ts`.

## Client

`PageViewBeacon` in the public layout (`src/features/analytics/components/page-view-beacon.tsx`) posts JSON to `POST /api/analytics/collect` (sendBeacon, then `fetch` keepalive). It does not run when DNT / Global Privacy Control is set.

Owners viewing their own site are skipped server-side (`session.user.id === tenant`).

## Server skip rules

`shouldSkipCollect`:

- Portfolio owner session
- `DNT: 1` or `Sec-GPC: 1`
- Empty or bot-like `User-Agent` (includes HeadlessChrome / Playwright)
- Paths under `/admin`, `/api`, and auth pages

## Abuse controls

- Tenant bind is **Host-only** (spoofed `x-tenant-username` cannot write another tenant’s stats).
- Fixed-window rate limit: 60 posts / minute / hashed IP (`RateLimit` collection, key prefix `app:analytics-collect:`). Over-limit returns 204 with no write.
- Payload capped (`path` 500, `referrer` 2000). Invalid JSON → 204.
- Endpoint always returns **204** (no body) so it cannot be used as an oracle.

`isNewVisit` is still client-supplied: it can inflate _visits_ for that IP’s window, not pageviews of other tenants. Treat visits as directional, not audit-grade.

## Surfaces

| Surface         | Data                                                              |
| --------------- | ----------------------------------------------------------------- |
| Public `/stats` | Aggregates without referrer hosts, if `PUBLIC_PAGE_LIVE.stats`    |
| Admin dashboard | Full summary including referrers, session-scoped to `ctx.user.id` |

tRPC: `analytics.getPublicSummary`, `analyticsAdmin.*`.

Privacy copy on the public privacy page should stay aligned with this file when the beacon fields change.
