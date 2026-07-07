import { formatPlayedAt } from "./format-played-at";

describe("formatPlayedAt", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("formats relative time in English", () => {
    expect(formatPlayedAt("2024-06-15T11:00:00.000Z", "en")).toMatch(
      /about 1 hour ago/i,
    );
  });

  it("formats relative time in Spanish", () => {
    expect(formatPlayedAt("2024-06-15T11:00:00.000Z", "es")).toMatch(
      /hace.*hora/i,
    );
  });

  it("falls back to English for unknown locales", () => {
    expect(formatPlayedAt("2024-06-15T11:00:00.000Z", "fr")).toMatch(
      /about 1 hour ago/i,
    );
  });
});
