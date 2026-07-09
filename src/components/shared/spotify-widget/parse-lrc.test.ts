import {
  findActiveLyricIndex,
  lyricPreviewWindow,
  parseLrc,
} from "./parse-lrc";

describe("parseLrc", () => {
  it("parses timed lines with centiseconds", () => {
    const lines = parseLrc(
      "[00:17.12] I feel your breath\n[00:21.50] Upon my neck\n",
    );

    expect(lines).toEqual([
      { timeMs: 17_120, text: "I feel your breath" },
      { timeMs: 21_500, text: "Upon my neck" },
    ]);
  });

  it("ignores blank and malformed lines", () => {
    const lines = parseLrc("not a lyric\n[01:02.003] Hello\n\n");
    expect(lines).toEqual([{ timeMs: 62_003, text: "Hello" }]);
  });
});

describe("findActiveLyricIndex", () => {
  const lines = parseLrc(
    "[00:10.00] First\n[00:20.00] Second\n[00:30.00] Third\n",
  );

  it("returns -1 before the first line", () => {
    expect(findActiveLyricIndex(lines, 0)).toBe(-1);
  });

  it("returns the latest line at or before currentMs", () => {
    expect(findActiveLyricIndex(lines, 10_000)).toBe(0);
    expect(findActiveLyricIndex(lines, 25_000)).toBe(1);
    expect(findActiveLyricIndex(lines, 90_000)).toBe(2);
  });
});

describe("lyricPreviewWindow", () => {
  const lines = parseLrc(
    "[00:01.00] A\n[00:02.00] B\n[00:03.00] C\n[00:04.00] D\n[00:05.00] E\n",
  );

  it("centers the active line in the window when possible", () => {
    expect(lyricPreviewWindow(lines, 2, 3)).toEqual({
      lines: [
        { timeMs: 2_000, text: "B" },
        { timeMs: 3_000, text: "C" },
        { timeMs: 4_000, text: "D" },
      ],
      activeOffset: 1,
    });
  });

  it("clamps near the start of the song", () => {
    expect(lyricPreviewWindow(lines, 0, 3)).toEqual({
      lines: [
        { timeMs: 1_000, text: "A" },
        { timeMs: 2_000, text: "B" },
        { timeMs: 3_000, text: "C" },
      ],
      activeOffset: 0,
    });
  });

  it("clamps near the end of the song", () => {
    expect(lyricPreviewWindow(lines, 4, 3)).toEqual({
      lines: [
        { timeMs: 3_000, text: "C" },
        { timeMs: 4_000, text: "D" },
        { timeMs: 5_000, text: "E" },
      ],
      activeOffset: 2,
    });
  });
});
