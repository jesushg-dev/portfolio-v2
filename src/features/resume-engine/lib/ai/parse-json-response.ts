export function parseAiJsonResponse(text: string): unknown {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const parsed: unknown = JSON.parse(cleaned);
  return parsed;
}

function isZodIssue(value: unknown): value is { message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  );
}

export function formatZodParseError(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "issues" in error &&
    Array.isArray(error.issues)
  ) {
    const first: unknown = error.issues[0];
    if (isZodIssue(first)) {
      return first.message;
    }
  }
  if (error instanceof SyntaxError) {
    return "Invalid JSON. Remove markdown fences and fix syntax errors.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Could not parse AI response JSON.";
}
