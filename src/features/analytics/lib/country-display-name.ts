export function countryDisplayName(
  code: string,
  locale: string,
  unknownLabel: string,
): string {
  if (code === "XX") return unknownLabel;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
