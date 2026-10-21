const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/** Extract unique email addresses from free text (e.g. a job description). */
export function extractEmailsFromText(text: string): string[] {
  const matches = text.match(EMAIL_RE) ?? [];
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const match of matches) {
    const normalized = match.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    emails.push(normalized);
  }
  return emails;
}
