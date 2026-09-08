# Tenant credentials (bring-your-own APIs)

Portfolio features that call third-party services use **each tenant’s own API keys and OAuth apps**, not a shared platform account. Admins connect those credentials under **Admin → Credentials** (`/admin/credentials`). Billing, quotas, and data residency stay with the tenant’s provider account.

Platform `.env` keys are reserved for **system** concerns (auth email, database, Better Auth). They must not be used as a silent fallback for portfolio contact mail, CV delivery, Spotify Now Playing, Google Calendar job-tracker sync, UploadThing storage, or AI (import / tailor / drafts).

---

## System vs tenant

| Concern                                                     | Source                                                    | Fallback                                                  |
| ----------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| Password reset / email 2FA OTP                              | `.env` `RESEND_*` + system template IDs                   | None — auth email simply does not send                    |
| Portfolio contact form                                      | Tenant Resend (`TenantIntegration` `resend`)              | **None**                                                  |
| Public CV PDF-by-email                                      | Tenant Resend                                             | **None**                                                  |
| Job Tracker outbound email                                  | Tenant Resend                                             | **None**                                                  |
| UploadThing (CV PDF cache, resume export, attachments)      | Tenant UploadThing                                        | **None**                                                  |
| Spotify Now Playing widget                                  | Tenant Spotify OAuth (`SpotifyConnection`)                | **None**                                                  |
| Job Tracker ↔ Google Calendar                               | Tenant Google Calendar OAuth (`GoogleCalendarConnection`) | **None** — never `GOOGLE_CLIENT_*` (those are login-only) |
| Resume import / ATS tailor / interview prep / job drafts AI | Tenant AI (`TenantIntegration` `ai`)                      | **None** (manual JSON mode still works)                   |

`.env.example` documents the same split: system Resend is auth-only; portfolio email, Spotify, UploadThing, and AI are per-tenant.

---

## Where tenants configure credentials

UI: `src/features/integrations/components/` → page at `src/app/[locale]/(admin)/admin/credentials/`.

| Provider        | Admin UI                                              | Runtime storage                                  | Resolver                                |
| --------------- | ----------------------------------------------------- | ------------------------------------------------ | --------------------------------------- |
| Resend          | Form → `integrationsAdmin.saveResend`                 | `TenantIntegration` (`provider: "resend"`)       | `getPortfolioEmailClient()`             |
| UploadThing     | Form → `integrationsAdmin.saveUploadThing`            | `TenantIntegration` (`provider: "uploadthing"`)  | `getTenantUploadThingClient()`          |
| AI              | Form → `integrationsAdmin.saveAi`                     | `TenantIntegration` (`provider: "ai"`)           | `loadTenantAiCredentials()`             |
| Spotify         | OAuth connect → `spotifyAdmin.initiateConnect`        | `SpotifyConnection` (+ encrypted secrets)        | `getSpotifyCredentialsForUser()`        |
| Google Calendar | OAuth connect → `googleCalendarAdmin.initiateConnect` | `GoogleCalendarConnection` (+ encrypted secrets) | `getGoogleCalendarCredentialsForUser()` |

Catalog: `src/features/integrations/lib/integration-catalog.ts` (`resend` \| `spotify` \| `google-calendar` \| `uploadthing` \| `ai`).

tRPC: `integrationsAdmin.*` in `src/features/integrations/server/integrations-admin.router.ts`. Spotify live connect uses `spotifyAdmin.*` (`src/server/api/routers/spotify-admin.ts`). Google Calendar uses `googleCalendarAdmin.*` (`src/server/api/routers/google-calendar-admin.ts`) — it must stay registered on `appRouter` in `src/server/api/root.ts`.

---

## Encryption & model

Secrets are encrypted at rest with AES-256-GCM (`src/lib/crypto/secret-encryption.ts`). Key material:

1. `INTEGRATION_ENCRYPTION_KEY` if set, else
2. `BETTER_AUTH_SECRET`

Helpers: `encryptJsonSecret` / `decryptJsonSecret` via `src/lib/integrations/tenant-integrations-service.ts`.

```prisma
model TenantIntegration {
  userId         String
  provider       String   // "resend" | "spotify" | "uploadthing" | "ai"
  enabled        Boolean
  credentialsEnc String   // AES-256-GCM encrypted JSON
  lastSyncedAt   DateTime?
  lastError      String?
  @@unique([userId, provider])
}
```

Spotify’s **runtime** path is the dedicated `SpotifyConnection` model (client id + encrypted client secret + encrypted refresh token), not the optional `TenantIntegration` `spotify` row. The Credentials page treats “connected” from `spotifyAdmin.getConnectionStatus`.

Google Calendar is the same pattern: `GoogleCalendarConnection` / `GoogleCalendarOAuthState`, not `TenantIntegration`. Connected state comes from `googleCalendarAdmin.getConnectionStatus`. `.env` `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` stay **Better Auth login only**.

Admin responses never return raw secrets — only masked prefixes/suffixes (`maskSecret` in the integrations router).

---

## Providers in detail

### Resend (tenant)

**Used for:** contact notifications, CV PDF delivery, Job Tracker application emails, optional HTML signature.

**Not used for:** Better Auth password reset / 2FA OTP (those stay on system Resend).

Flow:

1. Tenant pastes API key + email domain (optional `fromEmail`, signature).
2. `saveResend` encrypts config and, when credentials change, publishes templates into **that** Resend account (`syncResendTemplatesForTenant` in `src/lib/integrations/resend-tenant-publisher.ts`).
3. Template UUID map is stored on the same encrypted config (`templates["cv-delivery-en"]`, `contact-notification-*`, etc.).
4. Send paths call `getPortfolioEmailClient(userId)` — **no** `env.RESEND_API_KEY` fallback.

Key files: `src/lib/email/resend.ts`, contact / CV / job-tracker routers.

### UploadThing (tenant)

**Used for:** resume DOCX/PDF exports, CV PDF CDN cache, Job Tracker / import uploads.

`getTenantUploadThingClient(userId)` builds a `UTApi` from the tenant token (or app id + secret). Missing config → `UploadThingNotConfiguredError` / UI notice pointing to Credentials.

Platform `UPLOADTHING_TOKEN` remains in `src/env.ts` as optional legacy schema only; runtime upload paths do not read it.

See also: [`ats-cv-tailor.md`](./ats-cv-tailor.md), [`cv-pdf.md`](./cv-pdf.md).

### Spotify (tenant)

Each portfolio owner connects **their** Spotify Developer app (client id/secret) and completes OAuth. Tokens live in `SpotifyConnection`; the public widget calls Spotify with that user’s refresh → access token. No shared platform Spotify app.

See also: [`spotify-widget.md`](./spotify-widget.md) and privacy copy under Admin / public privacy pages.

### Google Calendar (tenant)

**Used for:** round-trip sync of Job Tracker `ApplicationEvent` rows the tenant created (interviews, meetings, follow-ups, etc.) with **their** Google Calendar.

**Not used for:** importing unrelated Google events; Better Auth Google login.

Flow:

1. Tenant creates an OAuth client in **their** Google Cloud project, enables Calendar API, and adds the redirect URI shown in Admin → Credentials → Google Calendar.
2. They paste Client ID + Secret and complete consent (`access_type=offline`, scope `calendar.events` only).
3. Tokens live encrypted in `GoogleCalendarConnection`. Create/update/delete of incomplete events push to Google; a throttled lazy pull on upcoming events refreshes linked ids only. Events created already `completed` (e.g. “CV emailed…”) are not pushed.

Key files: `src/lib/google-calendar/`, `src/features/google-calendar-connect/`, `src/app/api/google-calendar/callback/route.ts`.

### AI (tenant)

**Used for:** resume import, ATS DOCX tailor, interview prep, Job Tracker email / cover-letter drafts.

Flow:

1. Tenant saves Gemini / OpenAI / Anthropic keys under Admin → Credentials → AI (`integrationsAdmin.saveAi`). Empty fields keep existing keys.
2. Runtime loads `loadTenantAiCredentials(userId)` → `getTenantIntegrationConfig(userId, "ai")` and resolves providers only from those keys (`src/features/resume-engine/lib/ai/providers.ts`).
3. **No platform `.env` AI keys** — if the tenant has none, auto mode is unavailable; manual JSON still works.

`defaultProvider` in the form (`gemini` \| `openai` \| `anthropic`) maps to runtime ids (`gemini` \| `openai` \| `claude`).

---

## Adding a new tenant-backed provider

1. Extend `IntegrationProvider` + `IntegrationConfigMap` in `tenant-integrations-service.ts`.
2. Add catalog entry + admin form + `integrationsAdmin` save/get/disconnect.
3. Resolve credentials **only** via `getTenantIntegrationConfig` (or a dedicated model like Spotify) — never fall back to platform env for tenant product features.
4. Document the split here and in `.env.example`.

---

## Quick checklist

| Symptom                                       | Check                                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Contact / CV email fails                      | Admin → Credentials → Resend connected; templates synced (`syncedTemplatesCount` > 0)    |
| “UploadThing is not configured”               | Admin → Credentials → UploadThing                                                        |
| Now Playing empty / refresh error             | Admin → Credentials → Spotify reconnect                                                  |
| Job Tracker events missing in Google Calendar | Admin → Credentials → Google Calendar connected; event was not created already completed |
| ATS tailor “No AI provider configured”        | Admin → Credentials → AI (or use manual JSON mode)                                       |
| Auth reset mail fails                         | Platform `RESEND_API_KEY` / `RESEND_EMAIL_DOMAIN` / `RESEND_TEMPLATE_RESET_*`            |

---

## Shared platform costs (still on the operator)

These are **not** silent API-key fallbacks for tenant product features, but they still bill (or consume quota on) the platform owner as more tenants use the SaaS:

| Cost                                                  | Who pays                  | Notes                                                                                                                                                                                                                                                              |
| ----------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **System Resend** (password reset + 2FA OTP)          | Platform `.env`           | Every tenant’s auth emails. Low volume usually; scales with sign-ups / forgotten passwords. Portfolio contact/CV mail is already tenant-only.                                                                                                                      |
| **Cloudinary `js-media`**                             | Platform Cloudinary cloud | Owner seed/UI assets that still point at `res.cloudinary.com/js-media` (hero, project covers, contact GIF). Runtime no longer maps public ids or injects transforms. Tenant media must be stored as their own absolute URLs (UploadThing, their Cloudinary, etc.). |
| **Vercel** (serverless, Playwright CV PDF, bandwidth) | Platform                  | All tenants share your deployment. PDF generation is the heavy path.                                                                                                                                                                                               |
| **MongoDB Atlas**                                     | Platform                  | One cluster for all tenants.                                                                                                                                                                                                                                       |
| **Google / GitHub OAuth apps**                        | Platform app quotas       | Shared login apps if enabled — usually free-tier, abuse/quota risk not $ per call.                                                                                                                                                                                 |
| **lrclib.net** (lyrics)                               | Free public API           | Rate limits, not your invoice.                                                                                                                                                                                                                                     |
| **Nominatim / ip-api** (geocode / visitor geo)        | Free public APIs          | Rate limits / ToS — not metered keys.                                                                                                                                                                                                                              |

**Already safe (tenant BYOK, no platform fallback):** AI, portfolio Resend, UploadThing, Spotify OAuth, Google Calendar OAuth.

**Footgun:** `UPLOADTHING_TOKEN` remains optional in `src/env.ts` but runtime uploads do **not** read it. Do not reintroduce an env fallback.

If Cloudinary bandwidth becomes the pain point, rehost owner seed assets off `js-media` (tenant UploadThing or another CDN). Auth email can stay on system Resend unless you later move reset/2FA onto each tenant’s Resend.
