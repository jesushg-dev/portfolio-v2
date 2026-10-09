export function parseManualCoverLetterOutput(raw: string): {
  subject: string;
  body: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { subject: "", body: "" };
  }

  // 1. Check for JSON formatting (including markdown ```json ... ```)
  try {
    const cleaned = trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") {
      const subject =
        typeof parsed.subject === "string" ? parsed.subject.trim() : "";
      const body = typeof parsed.body === "string" ? parsed.body.trim() : "";
      if (subject || body) {
        return {
          subject: subject || "Carta de presentación",
          body: body || trimmed,
        };
      }
    }
  } catch {
    // Not JSON, continue to line parsing
  }

  // 2. Check for explicit subject prefix (e.g., "Asunto: ...", "Subject: ...")
  const lines = trimmed.split("\n");
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i]?.trim() ?? "";
    const match = /^(?:asunto|subject|título|title):\s*(.+)$/i.exec(line);
    if (match?.[1]) {
      const subject = match[1].trim();
      const body = lines
        .slice(i + 1)
        .join("\n")
        .trim();
      return { subject, body: body || trimmed };
    }
  }

  // 3. If first line is relatively short (< 80 chars), treat it as subject
  if (lines.length > 1 && (lines[0]?.trim().length ?? 0) < 80) {
    return {
      subject: lines[0]?.trim() ?? "Carta de presentación",
      body: lines.slice(1).join("\n").trim(),
    };
  }

  return {
    subject: "Carta de presentación",
    body: trimmed,
  };
}
