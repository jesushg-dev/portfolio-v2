const MAX_HOST_LENGTH = 253;

export function referrerHostFromUrl(
  referrer: string | null | undefined,
  requestHost?: string | null,
): string {
  const raw = referrer?.trim() ?? "";
  if (!raw) return "direct";

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (!host) return "direct";

    const current = (requestHost ?? "")
      .split(":")[0]
      ?.replace(/^www\./i, "")
      .toLowerCase();
    if (current && host === current) return "direct";

    return host.slice(0, MAX_HOST_LENGTH);
  } catch {
    return "direct";
  }
}

export function normalizeCountryCode(value: string | null | undefined): string {
  const code = value?.trim().toUpperCase() ?? "";
  if (/^[A-Z]{2}$/.test(code)) return code;
  return "XX";
}
