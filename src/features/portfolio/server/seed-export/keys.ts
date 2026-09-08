export function toPascalKey(value: string): string {
  const stripped = value.replace(/[^a-zA-Z0-9]+/g, "");
  if (!stripped) return "Item";
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

export function toKebabKey(value: string): string {
  const kebab = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return kebab || "item";
}

export function slugFromKey(key: string): string {
  return key
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
}

export function pascalFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function uniqueKey(base: string, used: Set<string>): string {
  const fallback = base || "item";
  if (!used.has(fallback)) {
    used.add(fallback);
    return fallback;
  }
  let index = 2;
  while (used.has(`${fallback}${index}`)) {
    index += 1;
  }
  const next = `${fallback}${index}`;
  used.add(next);
  return next;
}

export function sortByCatalogOrder<T>(
  items: T[],
  getKey: (item: T) => string,
  catalogKeys: string[],
): T[] {
  const index = new Map(catalogKeys.map((key, position) => [key, position]));
  return [...items].sort((left, right) => {
    const leftIndex = index.get(getKey(left));
    const rightIndex = index.get(getKey(right));
    if (leftIndex === undefined && rightIndex === undefined) return 0;
    if (leftIndex === undefined) return 1;
    if (rightIndex === undefined) return -1;
    return leftIndex - rightIndex;
  });
}
