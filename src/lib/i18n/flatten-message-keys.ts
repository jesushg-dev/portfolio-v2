export function flattenMessageKeys(
  obj: Record<string, unknown>,
  prefix = "",
): string[] {
  const keys: string[] = [];

  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenMessageKeys(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }

  return keys.sort();
}

export function compareMessageKeySets(
  sourceKeys: string[],
  targetKeys: string[],
): { missingInTarget: string[]; extraInTarget: string[] } {
  const source = new Set(sourceKeys);
  const target = new Set(targetKeys);

  return {
    missingInTarget: sourceKeys.filter((key) => !target.has(key)),
    extraInTarget: targetKeys.filter((key) => !source.has(key)),
  };
}
