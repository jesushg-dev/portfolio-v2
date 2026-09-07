# Email templates (React Email + Resend)

Two pipelines share the same React Email sources in `email-templates/`:

| Audience                 | Templates                         | Credentials                                                    |
| ------------------------ | --------------------------------- | -------------------------------------------------------------- |
| **System** (Better Auth) | Reset password, 2FA OTP           | Platform `.env` `RESEND_*`                                     |
| **Tenant** (portfolio)   | CV delivery, contact notification | Tenant Resend API + published template IDs on encrypted config |

Locales: en / es / nl. Copy: `email-templates/messages/*.json`.

## Package

Separate `package.json` (not the app’s pnpm workspace). From repo root:

```bash
cd email-templates
npm install
npm run preview          # render.tsx → email-templates/out
npm run publish:resend   # upsert + publish on the Resend account in RESEND_API_KEY
```

`publish-to-resend.ts` needs `RESEND_API_KEY` (and typically `RESEND_EMAIL_DOMAIN`). It prints template UUIDs — paste those into:

- Platform env: `RESEND_TEMPLATE_RESET_*`, `RESEND_TEMPLATE_TWO_FACTOR_*`
- Tenant: Admin → Credentials → Resend (sync also runs on save via `syncResendTemplatesForTenant`)

## Runtime

The Next app does **not** render these templates on the send path. It calls Resend `emails.send({ template: { id, variables } })`.

Variable names must stay in sync with `publish-to-resend.ts` (e.g. `RESET_URL`, `OTP_CODE`, `SENDER_NAME`, `MESSAGE`).

Next tracing **excludes** `email-templates/**` from serverless bundles (`next.config.ts`) so preview tooling does not ship to Vercel functions.

## Branding

Subjects, footer wordmark, and `email-templates/messages/*.json` use **jesushg.com**. `links` in `src/theme.ts` match the public CV (site, GitHub `jesushg`, LinkedIn, photo URL). After editing templates, regenerate compiled HTML and republish:

```bash
cd email-templates
npm run preview          # writes src/compiled-templates.ts (tenant publisher)
npm run publish:resend   # system templates on platform Resend
```

Tenants pick up compiled HTML on the next Credentials → Resend save (`syncResendTemplatesForTenant`).
