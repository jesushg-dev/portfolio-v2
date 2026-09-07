# Security model

This is a defense-in-depth checklist for operators, not a guarantee. No review can claim a production app is “100% secure.” Re-check after dependency bumps and new public endpoints.

Related: [`auth-security.md`](./auth-security.md), [`tenant-credentials.md`](./tenant-credentials.md), [`analytics.md`](./analytics.md), [`cv-pdf.md`](./cv-pdf.md).

## Trust boundaries

| Boundary | Rule |
| --- | --- |
| Tenant | Derived from **Host** (`parseTenantSlug`). Apex is the primary `Profile` only. |
| Admin / tRPC mutations | `protectedProcedure` + `ctx.user.id` (never another user’s id from the client). |
| Public CV | `isPublicCvVisible`: primary owner always; other tenants only if `isPublished`. |
| Tenant secrets | AES-256-GCM at rest. Prefer `INTEGRATION_ENCRYPTION_KEY`; else `BETTER_AUTH_SECRET`. |
| System vs product APIs | Platform `.env` Resend is auth-only. Portfolio mail/AI/storage/Spotify/Calendar are BYOK. |
| Internal PDF | `Authorization: Bearer CV_PDF_GENERATOR_SECRET`. Chromium `baseUrl` is `getServerBaseUrl()`, not request JSON. |

`x-tenant-username` on `/api/*` is **not** set by middleware. Collect and tRPC must not treat that header as identity. PDF generation may send it **together with** `x-cv-pdf-tenant-proof` (HMAC-SHA256 of the username with `CV_PDF_GENERATOR_SECRET`) so preview hosts without tenant DNS still render the right CV.

## Auth

- Better Auth 1.7, passkeys (`userVerification: required`), TOTP + email OTP + backup codes.
- Production: Have I Been Pwned on sign-up/reset; database-backed rate limits on login and 2FA.
- Password-reset tokens and 2FA OTPs are logged **only when `NODE_ENV !== production`**.
- Admin layout redirects unauthenticated users to login.

## HTTP hardening (`next.config.ts`)

Set on all routes:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN` + CSP `frame-ancestors 'self'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera/mic/geo/payment/usb off; passkey get/create `self`)
- Production: `upgrade-insecure-requests`, HSTS 2 years includeSubDomains preload

CSP does **not** yet lock `script-src` / `style-src` (Next inline runtime + embeds need nonces). XSS in a trusted origin is therefore still high impact.

## Rate limits (app)

| Path | Limit |
| --- | --- |
| Better Auth sign-in / reset / 2FA | See `src/lib/auth.ts` `rateLimit.customRules` |
| `POST /api/analytics/collect` | 60 / minute / IP |
| `contact.sendMessage` | 5 / hour / IP / tenant |
| `cvPublic.sendPdfByEmail` | 3 / hour / IP and 5 / day / recipient (`CvPdfEmailLog`) |

## Uploads and outbound fetch

- UploadThing `resumeImporter`: session required, 8 MB, 1 file.
- Job import from LinkedIn: host allowlist + manual redirects (`isSafeLinkedInHref`).
- Geo fallback: HTTPS ip-api.com, IPv4-only, skips private/link-local (including `169.254.169.254`).
- `next/image` allows any **HTTPS** hostname for tenant logos; HTTP catch-all is disabled.

## Residual risk (accepted or follow-up)

1. **Partial CSP** — no `script-src` nonce yet.
2. **Open HTTPS image optimizer** — `hostname: "**"` can be abused as a fetch proxy; needed for tenant image URLs.
3. **Client `isNewVisit`** — visit counts are not cryptographic.
4. **Lyrics `/api/lyrics`** — public cache in front of lrclib; no dedicated rate limit.
5. **tRPC timing logs** — procedure names and duration in server logs.
6. **MongoDB / Vercel / Cloudinary** — platform billing and cluster isolation are operator concerns (`docs/tenant-credentials.md`).
7. **Custom domains** — stored, not routed; do not point DNS at the app until that ships.

## Operator checklist

- Distinct `BETTER_AUTH_SECRET` (and MongoDB database name) for production vs Preview/e2e.
- `CV_PDF_GENERATOR_SECRET` ≥ 16 chars in production.
- Rotate `INTEGRATION_ENCRYPTION_KEY` only with a decrypt/re-encrypt plan (old ciphertexts use the previous key).
- Never commit `.env` / `.env.local` (`.gitignore` has `.env*` with `!.env.example`).
- After adding a public mutation, add an IP or user rate limit and a tenant/user `where` clause.
