import { formatDate } from "./format";

describe("formatDate", () => {
  it("returns an empty string when date is undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("returns an empty string when date is falsy (0)", () => {
    expect(formatDate(0)).toBe("");
  });

  it("formats a Date object with default options", () => {
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    const result = formatDate(date);
    expect(result).toContain("2024");
    expect(result).toContain("15");
  });

  it("formats a date string (month-year only to avoid timezone drift)", () => {
    // Use a Date object directly to avoid the UTC midnight → local timezone shift
    // that ISO strings like "2023-06-01" cause in negative-offset timezones.
    const date = new Date(2023, 5, 1); // June 1, 2023 in local time
    const result = formatDate(date);
    expect(result).toContain("2023");
    expect(result).toContain("June");
  });

  it("formats a numeric timestamp", () => {
    const ts = new Date(2022, 3, 20).getTime();
    const result = formatDate(ts);
    expect(result).toContain("2022");
    expect(result).toContain("20");
  });

  it("respects custom year-only option", () => {
    const result = formatDate(new Date(2021, 6, 4), {
      month: undefined,
      day: undefined,
      year: "numeric",
    });
    expect(result).toBe("2021");
  });

  it("returns an empty string for an invalid date string", () => {
    expect(formatDate("not-a-date")).toBe("");
  });

  it("overrides default month, day, and year options", () => {
    const result = formatDate(new Date(2024, 5, 10), {
      month: "short",
      day: "2-digit",
      year: "2-digit",
    });
    expect(result).toContain("Jun");
    expect(result).toContain("24");
  });
});
