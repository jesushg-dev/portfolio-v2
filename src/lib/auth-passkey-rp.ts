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
  origin: string[];
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

function originOf(value: string, defaultProtocol = "https"): string | null {
  const withScheme = /^https?:\/\//.test(value)
    ? value
    : `${defaultProtocol}://${value}`;
  try {
    return new URL(withScheme).origin.toLowerCase();
  } catch {
    return null;
  }
}

export function resolvePasskeyRelyingParty(
  input: PasskeyRelyingPartyInput,
): PasskeyRelyingParty {
  let rpID: string;
  if (input.betterAuthUrl) {
    rpID = hostnameOf(input.betterAuthUrl) ?? "localhost";
  } else if (input.nodeEnv === "production") {
    rpID = hostnameOf(input.primaryDomain) ?? input.primaryDomain;
  } else {
    rpID = hostnameOf(input.devDomain) ?? "localhost";
  }

  const explicitBetterAuthOrigin = input.betterAuthUrl
    ? originOf(input.betterAuthUrl)
    : null;

  const rawOrigins: (string | null)[] =
    input.nodeEnv === "production"
      ? [
          `https://${input.primaryDomain}`,
          `https://www.${input.primaryDomain}`,
          explicitBetterAuthOrigin,
        ]
      : [
          "http://localhost:3000",
          "http://127.0.0.1:3000",
          originOf(input.devDomain, "http"),
          "http://lvh.me:3000",
          explicitBetterAuthOrigin,
        ];

  const origin = Array.from(
    new Set(rawOrigins.filter((o): o is string => Boolean(o))),
  );

  return {
    rpID,
    rpName: PASSKEY_RP_NAME,
    origin,
  };
}
