# Documentation index

Start here if you are onboarding or looking for a topic. The [root README](../README.md) is the install + tenant DNS guide.

## Platform

| Doc                                              | What it covers                                         |
| ------------------------------------------------ | ------------------------------------------------------ |
| [architecture.md](./architecture.md)             | Request path, feature map, Prisma, hosting             |
| [security.md](./security.md)                     | Trust boundaries, headers, rate limits, residual risk  |
| [auth-security.md](./auth-security.md)           | Better Auth 1.7, 2FA, passkeys, HIBP, blocked upgrades |
| [tenant-credentials.md](./tenant-credentials.md) | BYOK Resend, Spotify, Google Calendar, UploadThing, AI |
| [i18n.md](./i18n.md)                             | Locales, pathnames, message parity, seed translations  |
| [testing.md](./testing.md)                       | Jest, Playwright projects, CI secrets                  |
| [seed-and-export.md](./seed-and-export.md)       | `prisma/data`, `pnpm db:seed`, admin JSON export       |

## Public site & CMS

| Doc                                  | What it covers                                                |
| ------------------------------------ | ------------------------------------------------------------- |
| [admin-cms.md](./admin-cms.md)       | `/admin` resources, IDs, publish flags                        |
| [public-pages.md](./public-pages.md) | Now, Uses, colophon, stats, process pages, `PUBLIC_PAGE_LIVE` |
| [analytics.md](./analytics.md)       | Beacon, collect, `/stats`, admin overview                     |
| [cv-pdf.md](./cv-pdf.md)             | Public CV PDF cache + Playwright generator                    |
| [form.md](./form.md)                 | Shared admin form primitives                                  |
| [media.md](./media.md)               | Local vs remote URLs, `MediaImage`                            |

## Product tools (admin)

| Doc                                        | What it covers                              |
| ------------------------------------------ | ------------------------------------------- |
| [job-tracker.md](./job-tracker.md)         | Applications, events, email, Calendar sync  |
| [resume-engine.md](./resume-engine.md)     | Import, interview prep, links to ATS tailor |
| [ats-cv-tailor.md](./ats-cv-tailor.md)     | Resume Engine ATS DOCX pipeline             |
| [email-templates.md](./email-templates.md) | React Email package + Resend publish        |

## Widgets & UI systems

| Doc                                        | What it covers                        |
| ------------------------------------------ | ------------------------------------- |
| [spotify-widget.md](./spotify-widget.md)   | Now Playing, lyrics, polling          |
| [ios-device.md](./ios-device.md)           | iPhone mockup + navigation stack      |
| [mini-apps-guide.md](./mini-apps-guide.md) | Building a mini-app inside the mockup |

Environment variables: [`.env.example`](../.env.example) and `src/env.ts`.
