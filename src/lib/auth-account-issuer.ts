/**
 * Better Auth 1.7 keys accounts on `(issuer, accountId)` instead of
 * `(providerId, accountId)`. With `account.identityStrategy: "provider-id"`
 * the issuer is a deterministic namespace derived from the provider id, which
 * is what these helpers reproduce (they mirror `@better-auth/core/db`).
 *
 * Used by the one-off data backfill (`prisma/scripts/backfill-account-issuer.ts`)
 * and by the seed so rows written outside Better Auth match its expectations.
 */

export const CREDENTIAL_PROVIDER_ID = "credential";

/** Namespace Better Auth uses for email + password accounts. */
export const CREDENTIAL_ACCOUNT_ISSUER = "local:credential";

const OAUTH_ISSUER_PREFIX = "local:oauth:";

/** Synthetic issuer for OAuth/social providers (Google, GitHub, ...). */
export function createOAuthAccountIssuer(providerId: string): string {
  return `${OAUTH_ISSUER_PREFIX}${encodeURIComponent(providerId)}`;
}

/**
 * Resolve the issuer a pre-1.7 account row must be backfilled with.
 * This app only ever created `credential` accounts plus optional Google/GitHub
 * social accounts, so every non-credential provider is an OAuth provider.
 */
export function resolveAccountIssuer(providerId: string): string {
  if (providerId === CREDENTIAL_PROVIDER_ID) return CREDENTIAL_ACCOUNT_ISSUER;
  return createOAuthAccountIssuer(providerId);
}
