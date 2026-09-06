import {
  analyticsRetentionCutoff,
  utcDay,
  utcDaysAgo,
} from "./utc-day";

describe("utcDay", () => {
  it("strips the time to UTC midnight", () => {
    const date = new Date("2026-09-06T15:45:12.345Z");
    expect(utcDay(date).toISOString()).toBe("2026-09-06T00:00:00.000Z");
  });
});

describe("utcDaysAgo", () => {
  it("subtracts whole UTC days from midnight", () => {
    const from = new Date("2026-09-06T18:00:00.000Z");
    expect(utcDaysAgo(3, from).toISOString()).toBe("2026-09-03T00:00:00.000Z");
  });
});

describe("analyticsRetentionCutoff", () => {
  it("is 13 UTC months before the given day", () => {
    const from = new Date("2026-09-06T12:00:00.000Z");
    expect(analyticsRetentionCutoff(from).toISOString()).toBe(
      "2025-08-06T00:00:00.000Z",
    );
  });
});
