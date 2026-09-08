import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

/**
 * Two-factor redirects are handled where the sign-in happens (login form) so
 * the locale-aware `/two-factor` route and the `next` target are preserved.
 */
export const authClient = createAuthClient({
  plugins: [twoFactorClient(), passkeyClient()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

/** Narrow a `signIn.email` result to the "second factor required" response. */
export function isTwoFactorRedirect(
  data: unknown,
): data is { twoFactorRedirect: true; twoFactorMethods?: string[] } {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { twoFactorRedirect?: unknown }).twoFactorRedirect === true
  );
}

/** WebAuthn conditional UI (passkey autofill in the email field) support check. */
export async function supportsPasskeyAutofill(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const credential = window.PublicKeyCredential as
    | (typeof window.PublicKeyCredential & {
        isConditionalMediationAvailable?: () => Promise<boolean>;
      })
    | undefined;
  if (!credential?.isConditionalMediationAvailable) return false;
  try {
    return await credential.isConditionalMediationAvailable();
  } catch {
    return false;
  }
}
