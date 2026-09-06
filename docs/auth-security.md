# Auth security: Better Auth 1.7, 2FA and passkeys

## Better Auth 1.6 → 1.7 account-identity migration (Prisma + MongoDB)

Better Auth 1.7 keys accounts on `(issuer, accountId)` instead of
`(providerId, accountId)`. Prisma + MongoDB has no CLI migration, so the data
backfill is done by our own scripts. The order matters:

1. **Backup** the MongoDB database (Atlas snapshot or `mongodump`).
2. **Audit** (read-only): `pnpm db:auth-audit` — lists provider ids, rows
   without `issuer` and `(providerId|issuer, accountId)` collisions.
3. **Backfill** (additive, idempotent): `pnpm db:auth-backfill`
   - `credential` → `issuer: "local:credential"`, `accountId = userId`
   - any other provider → `issuer: "local:oauth:<encodeURIComponent(providerId)>"`
     The 1.6 app ignores the extra field, so this can run while 1.6 is live.
4. **Schema**: `pnpm db:push` creates the unique index
   `Account(issuer, accountId)` plus the `TwoFactor`, `Passkey` and
   `RateLimit` collections/indexes. It fails safely if collisions exist.
5. **Deploy** the 1.7 app. Without steps 3–4 the 1.7 Prisma Client fails to
   read `Account` rows (`issuer` is required) and nobody can log in.

Mapping helpers live in `src/lib/auth-account-issuer.ts` (unit-tested) and are
shared by the seed (`prisma/seed-portfolio-user.ts`) so seeded owners match
what Better Auth writes on sign-up.

Rollback: `db.Account.updateMany({}, { $unset: { issuer: "" } })` and drop the
`Account_issuer_accountId_key` index, then redeploy 1.6.

## Two-factor authentication (opt-in)

- Enabled per user from **Admin → Settings → Security**.
- Methods: TOTP (authenticator app), email OTP fallback (Resend, 5-minute
  codes) and 10 single-use backup codes.
- Devices are never remembered (`trustDevice: false`): a code is required on
  every password login.
- Passkey sign-in is phishing-resistant MFA on its own and skips the 2FA step
  by design; user verification (biometrics/PIN) is required.

## Rate limiting

Login, passkey and two-factor endpoints are rate limited with database storage
(`RateLimit` collection) so limits are shared across serverless instances.

## Breached-password check

In production, sign-up and password reset reject passwords found in the
Have I Been Pwned corpus (`haveIBeenPwned` plugin, k-anonymity range lookup).
It is disabled outside production: it needs outbound network access and the
e2e fixtures reuse a throwaway password. If your own admin password is
rejected, it has appeared in a public breach — change
`OWNER_USER_PASSWORD` in `.env.local`, then re-hash the credential Account
rows (see `prisma/seed-portfolio-user.ts`, which uses `hashPassword` from
`better-auth/crypto`). Mirror the new value in Vercel env vars if production
uses the same owner account.

## Testing

- Unit: `two-factor-section.test.tsx`, `two-factor-verify-form.test.tsx`,
  `auth-passkey-rp.test.ts`, `auth-email.test.ts`, `two-factor-methods.test.ts`.
- E2E (`pnpm exec playwright test --project two-factor`): enables TOTP from
  the settings card, computes codes with `e2e/helpers/totp.ts`, checks that a
  password alone no longer signs in, that a backup code works exactly once,
  disables 2FA again, and asserts the hardening headers. It uses a dedicated
  `-e2e-2fa` account and resets its 2FA rows before/after the run.
- Passkeys need a real authenticator and are not covered by e2e.

## Blocked upgrades

Everything else from the latest dependency sweep is current. These remain blocked
on purpose:

- **ESLint 10** / **@eslint/js 10** — `eslint-plugin-react@7.37.5` still peers
  only through ESLint 9 (`context.getFilename` crash under 10).
  `eslint-config-next` depends on that plugin. Stay on 9.39.x.
- **TypeScript 7** — `typescript-eslint@8.69` peers `typescript: >=4.8.4 <6.1.0`
  (and `ts-morph` still needs the old compiler API). Stay on 6.0.x.
- **Prisma 7 / 8** — Prisma 7 dropped MongoDB. Prisma 8 is RC and uses a new
  “contract” client API incompatible with `better-auth`'s Prisma adapter.
  Stay on 6.19.3 until Prisma 8 is GA **and** better-auth supports it.
- **pnpm 12** — packageManager stays on 10.34.x until CI/Docker/`corepack`
  images are updated together (major tooling jump, not an app dependency).
- **nwsapi** — pin `2.2.24` via `pnpm.overrides`. 2.2.25–2.2.27 still hang
  (~250s) on `:modal` / `:fullscreen` under jsdom when `@floating-ui` probes
  top-layer selectors (`action-hint` tests). Jest still pulls `jsdom@26`.
