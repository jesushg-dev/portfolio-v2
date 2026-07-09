export type SyncedLyricLine = {
  timeMs: number;
  text: string;
};

const LRC_LINE_RE = /^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/;

/** Parse LRC synced lyrics into timed lines (ms). */
export function parseLrc(syncedLyrics: string): SyncedLyricLine[] {
  const lines: SyncedLyricLine[] = [];

  for (const raw of syncedLyrics.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const match = LRC_LINE_RE.exec(trimmed);
    if (!match) continue;

    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const fraction = match[3] ?? "0";
    // LRC fractions are centiseconds (2 digits) or milliseconds (3 digits)
    const fractionMs =
      fraction.length <= 2
        ? Number(fraction.padEnd(2, "0")) * 10
        : Number(fraction.padEnd(3, "0").slice(0, 3));
    const timeMs = minutes * 60_000 + seconds * 1_000 + fractionMs;
    const text = (match[4] ?? "").trim();

    lines.push({ timeMs, text });
  }

  return lines.sort((a, b) => a.timeMs - b.timeMs);
}

/** Index of the active line for a given playback position. */
export function findActiveLyricIndex(
  lines: SyncedLyricLine[],
  currentMs: number,
): number {
  if (lines.length === 0) return -1;

  let active = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (line.timeMs <= currentMs) active = i;
    else break;
  }
  return active;
}

/**
 * Window of lines around the active index for a fixed-height preview card.
 * Keeps the active line centered when possible.
 */
export function lyricPreviewWindow(
  lines: SyncedLyricLine[],
  activeIndex: number,
  maxLines: number,
): { lines: SyncedLyricLine[]; activeOffset: number } {
  if (lines.length === 0 || maxLines <= 0) {
    return { lines: [], activeOffset: -1 };
  }

  if (activeIndex < 0) {
    return { lines: lines.slice(0, maxLines), activeOffset: -1 };
  }

  const half = Math.floor(maxLines / 2);
  const maxStart = Math.max(0, lines.length - maxLines);
  const start = Math.min(Math.max(0, activeIndex - half), maxStart);
  const slice = lines.slice(start, start + maxLines);
  const activeOffset = activeIndex - start;

  return { lines: slice, activeOffset };
}
