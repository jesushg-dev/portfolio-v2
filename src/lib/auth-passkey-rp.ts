/**
 * WebAuthn relying-party id resolution for the Better Auth passkey plugin.
 *
 * Because `baseURL` is resolved per request (dynamic `allowedHosts`), the plugin
 * cannot derive `rpID` from it and would fall back to "localhost", so we must be
 * explicit. The rpID has to be a registrable suffix of the page origin:
 * `jesushg.com` is valid for `jesushg.com` and every tenant subdomain.
 */
export interface PasskeyRelyingPartyInput {
  nodeEnv: string | undefined;
  primaryDomain: string;
  /** e.g. "lvh.me:3000" or "http://localhost:3000" */
  devDomain: string;
  betterAuthUrl?: string | undefined;
}

export interface PasskeyRelyingParty {
  rpID: string;
  rpName: string;
}

export const PASSKEY_RP_NAME = "Jehg";

function hostnameOf(value: string): string | null {
  const withScheme = /^https?:\/\//.test(value) ? value : `http://${value}`;
  try {
    return new URL(withScheme).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function resolvePasskeyRelyingParty(
  input: PasskeyRelyingPartyInput,
): PasskeyRelyingParty {
  if (input.betterAuthUrl) {
    const explicit = hostnameOf(input.betterAuthUrl);
    if (explicit) return { rpID: explicit, rpName: PASSKEY_RP_NAME };
  }

  if (input.nodeEnv === "production") {
    return {
      rpID: hostnameOf(input.primaryDomain) ?? input.primaryDomain,
      rpName: PASSKEY_RP_NAME,
    };
  }

  return {
    rpID: hostnameOf(input.devDomain) ?? "localhost",
    rpName: PASSKEY_RP_NAME,
  };
}
