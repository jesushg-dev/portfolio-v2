# Portfolio (jesushg.com)

Multi-tenant portfolio and CV platform. Each user gets a public site at `{username}.jesushg.com`, plus an admin CMS, Job Tracker, and ATS resume tools.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, next-intl (en / es / nl), tRPC, Prisma 6 on MongoDB, Better Auth 1.7 (passkeys + 2FA).

> The historical changelog still mentions Next.js 15 / React 18; this repo is on Next.js 16.3 and React 19. Package manager is **pnpm** (`packageManager` in `package.json`).

## Table of contents

- [Features](#features)
- [Documentation](#documentation)
- [Getting started](#getting-started)
- [Multi-tenancy & subdomains](#multi-tenancy--subdomains)
- [Environment](#environment)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

## Features

**Public site**

- Localized home, skills, projects, certifications, timeline, services, CV, privacy, theme customizer, and optional `/stats`
- Spotify Now Playing (tenant OAuth), contact form + globe, Calendly schedule
- CV PDF / DOCX download and email delivery

**Admin (`/admin`)**

- Profile, CV editor (including personal references), skills, projects, certifications, timeline, soft skills, services
- Now / Uses / process pages, Job Tracker, Resume Engine (import, ATS tailor, interview prep)
- Credentials (Resend, Spotify, Google Calendar, UploadThing, AI), security (2FA / passkeys), seed JSON export
- Analytics overview (pageviews, countries, referrers)

**Platform**

- Subdomain tenants, per-tenant API keys (no shared Resend/AI/UploadThing/Spotify fallback)
- Playwright e2e, Jest unit tests, axe a11y smoke

## Documentation

Full catalog: [`docs/README.md`](./docs/README.md).

| Doc                                                          | Topic                                          |
| ------------------------------------------------------------ | ---------------------------------------------- |
| [`docs/architecture.md`](./docs/architecture.md)             | Request flow, features, data                   |
| [`docs/security.md`](./docs/security.md)                     | Auth, tenant isolation, headers, residual risk |
| [`docs/auth-security.md`](./docs/auth-security.md)           | Better Auth 1.7, 2FA, passkeys, rate limits    |
| [`docs/tenant-credentials.md`](./docs/tenant-credentials.md) | BYOK integrations                              |
| [`docs/admin-cms.md`](./docs/admin-cms.md)                   | Admin resources and publish flags              |
| [`docs/analytics.md`](./docs/analytics.md)                   | Pageview collection and `/stats`               |
| [`docs/testing.md`](./docs/testing.md)                       | Jest, Playwright, CI                           |
| [`.env.example`](./.env.example)                             | Environment variables                          |

## Getting started

### Prerequisites

- Node.js 22+ (see CI) and [pnpm](https://pnpm.io) 10
- MongoDB (local or Atlas). The URI **must** include a database name in the path.

### Installation

```bash
git clone <repository-url>
cd portfolio-v2
cp .env.example .env.local
# Fill MONGODB_URI, BETTER_AUTH_SECRET, OWNER_USER_EMAIL, OWNER_USER_PASSWORD
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

Open [http://lvh.me:3000](http://lvh.me:3000) (recommended) or [http://localhost:3000](http://localhost:3000).

`pnpm db:push` runs `scripts/validate-mongodb-uri.mjs` first so a URI without a database name fails fast.

## Multi-tenancy & subdomains

Each tenant is a `Profile` (`username`, `isPrimary`, `isPublished`). Resolution lives in `src/lib/tenant/` and runs from the request **Host**. The apex domain (`jesushg.com`) is the primary owner (`isPrimary: true`). Reserved subdomains (`www`, `dashboard`, `app`, `admin`, `api`, `auth`) never map to a profile.

Third-party APIs (Resend, UploadThing, Spotify, Google Calendar, AI) use **each tenant’s own keys** via Admin → Credentials. Details: [`docs/tenant-credentials.md`](./docs/tenant-credentials.md).

### Local development with subdomains

Browsers do not resolve random `*.localhost` hosts on every OS. Use [`lvh.me`](https://lvh.me) — `*.lvh.me` resolves to `127.0.0.1`.

Examples while `pnpm dev` is running:

- `http://lvh.me:3000` → apex (primary owner)
- `http://jesus.lvh.me:3000` → owner CV via the `jesus` subdomain
- `http://alice.lvh.me:3000` → tenant `alice` (empty/404 if that username is missing)
- `http://dashboard.lvh.me:3000/admin` → reserved host; still the same app (auth required for `/admin`)

Chrome/Edge also resolve `*.localhost`; Safari does not. `lvh.me` is the supported option.

`.env.local` should include:

```
PRIMARY_DOMAIN=jesushg.com
NEXT_PUBLIC_PRIMARY_DOMAIN=jesushg.com
NEXT_PUBLIC_DEV_DOMAIN=lvh.me:3000
BETTER_AUTH_URL=http://lvh.me:3000
```

Better Auth `trustedOrigins` includes `https://*.jesushg.com` in production. Cross-subdomain cookies are enabled only in production.

### Production: wildcard DNS + TLS

1. **DNS**: wildcard record for `*.jesushg.com` to your host (Vercel: `cname.vercel-dns.com`).
2. **Vercel**: add `jesushg.com` and `*.jesushg.com`. Wildcard certificates need Vercel Pro+.
3. **Better Auth**: `BETTER_AUTH_URL=https://jesushg.com` and matching `PRIMARY_DOMAIN`.
4. **Custom domains** (`Profile.customDomain`) are stored but request routing is not implemented yet.

Sign-up rejects reserved usernames (same list as `RESERVED_SUBDOMAINS`).

### Seeding the primary owner

```
OWNER_USER_EMAIL=your-email@example.com
OWNER_USER_PASSWORD=your-secure-password
```

After `pnpm db:push`:

```
pnpm db:seed
```

`prisma/seed.ts` is idempotent: languages, primary user/profile, and portfolio JSON fixtures (`prisma/data/*.json`). List-style CV sections are wiped and recreated; header/about are upserted. The same `OWNER_USER_*` values are used by Playwright.

## Environment

Copy [`.env.example`](./.env.example). Schema: `src/env.ts`.

| Variable                           | Role                                                            |
| ---------------------------------- | --------------------------------------------------------------- |
| `MONGODB_URI`                      | Prisma MongoDB URI **with database name**                       |
| `BETTER_AUTH_SECRET`               | Auth signing + default integration encryption fallback          |
| `BETTER_AUTH_URL`                  | Canonical origin (emails, PDF base URL)                         |
| `RESEND_*`                         | **System** mail only (password reset, 2FA OTP)                  |
| `PRIMARY_DOMAIN` / `NEXT_PUBLIC_*` | Tenant host parsing                                             |
| `CV_PDF_GENERATOR_SECRET`          | Required in production for `/api/internal/cv/generate-pdf`      |
| `INTEGRATION_ENCRYPTION_KEY`       | Optional AES key for tenant secrets (else `BETTER_AUTH_SECRET`) |
| `GOOGLE_*` / `GITHUB_*`            | Optional social login                                           |

Portfolio Resend, Spotify, Google Calendar, UploadThing, and AI keys are **not** platform env vars.

## Scripts

| Script                                         | Purpose                          |
| ---------------------------------------------- | -------------------------------- |
| `pnpm dev`                                     | Next.js dev (Turbopack)          |
| `pnpm build` / `pnpm start`                    | Production server                |
| `pnpm lint` / `pnpm type`                      | ESLint + `tsc --noEmit`          |
| `pnpm test`                                    | Jest                             |
| `pnpm test:e2e`                                | Playwright smoke                 |
| `pnpm test:e2e:full`                           | Full create suites               |
| `pnpm test:a11y`                               | axe on public routes             |
| `pnpm db:push`                                 | Prisma schema → MongoDB          |
| `pnpm db:seed`                                 | Idempotent seed                  |
| `pnpm db:auth-audit` / `pnpm db:auth-backfill` | Better Auth 1.7 account identity |

See [`docs/testing.md`](./docs/testing.md) for CI secrets and Playwright projects (`pnpm exec playwright test --project skills`).

## Contributing

Open an issue first for large changes. Use a feature branch and a pull request. Keep tests co-located (`*.test.ts` next to source). Do not commit `.env` files or secrets.

## License

[MIT](LICENSE) — Copyright (c) 2026 Jesus Hernandez.

## Contact

Use the contact form on [jesushg.com](https://jesushg.com) (Let's Talk).
