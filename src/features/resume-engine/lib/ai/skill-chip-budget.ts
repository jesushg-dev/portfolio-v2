/**
 * Short skill-list labels (React, C# / .NET Core) — not sentences or bullets.
 */
export function isSkillChipText(text: string): boolean {
  const trimmed = text.replace(/^•\s*/, "").trim();
  if (trimmed.length === 0 || trimmed.length > 36) return false;
  if (/[.!?]/.test(trimmed)) return false;
  if (trimmed.split(/\s+/).length > 6) return false;
  return true;
}

/** Extra room so "React" can become "React 18+" without shrinking back. */
export function skillAlignedBudget(originalText: string): number {
  const length = originalText.length;
  if (!isSkillChipText(originalText)) return length;
  return Math.max(length, 22);
}
