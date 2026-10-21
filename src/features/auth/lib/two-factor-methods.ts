/**
 * Second-factor methods the verify page can offer. `backup` is always
 * available once 2FA is enabled (codes are generated on enable), so it is the
 * escape hatch when the authenticator or the inbox is unreachable.
 */
export const TWO_FACTOR_METHODS = ["totp", "otp", "backup"] as const;

export type TwoFactorMethod = (typeof TWO_FACTOR_METHODS)[number];

const DEFAULT_METHODS: readonly TwoFactorMethod[] = ["totp", "otp", "backup"];

function isTwoFactorMethod(value: string): value is TwoFactorMethod {
  return (TWO_FACTOR_METHODS as readonly string[]).includes(value);
}

/**
 * Parse the `methods` query param written by the login form from Better Auth's
 * `twoFactorMethods` (e.g. "totp,otp"). Unknown values are ignored, order is
 * normalised to totp → otp → backup and `backup` is always appended.
 */
export function parseTwoFactorMethods(
  raw: string | null | undefined,
): TwoFactorMethod[] {
  if (!raw) return [...DEFAULT_METHODS];

  const requested = new Set(
    raw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(isTwoFactorMethod),
  );
  requested.add("backup");

  const ordered = TWO_FACTOR_METHODS.filter((method) => requested.has(method));
  return ordered.length > 1 ? ordered : [...DEFAULT_METHODS];
}

/** Serialise Better Auth's `twoFactorMethods` for the `/two-factor` URL. */
export function serializeTwoFactorMethods(
  methods: readonly string[] | undefined,
): string | undefined {
  if (!methods?.length) return undefined;
  const known = methods.filter(isTwoFactorMethod);
  return known.length > 0 ? known.join(",") : undefined;
}
