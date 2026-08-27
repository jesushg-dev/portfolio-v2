export const NEW_COMPANY_PREFIX = "__new__:" as const;

export function encodeNewCompanyName(name: string): string {
  return `${NEW_COMPANY_PREFIX}${name.trim()}`;
}

export function decodeNewCompanyName(value: string): string | null {
  if (!value.startsWith(NEW_COMPANY_PREFIX)) return null;
  const name = value.slice(NEW_COMPANY_PREFIX.length).trim();
  return name.length > 0 ? name : null;
}

export function isNewCompanyValue(value: string): boolean {
  return value.startsWith(NEW_COMPANY_PREFIX);
}

export function resolveCompanyLabel(
  value: string,
  companies: readonly { id: string; name: string }[],
): string | null {
  if (!value) return null;

  const newName = decodeNewCompanyName(value);
  if (newName) return newName;

  return companies.find((company) => company.id === value)?.name ?? null;
}

/** Match an imported company name to an existing row, or encode a pending create. */
export function matchCompanyByName(
  name: string,
  companies: readonly { id: string; name: string }[],
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const found = companies.find(
    (company) => company.name.toLowerCase() === trimmed.toLowerCase(),
  );
  return found ? found.id : encodeNewCompanyName(trimmed);
}
