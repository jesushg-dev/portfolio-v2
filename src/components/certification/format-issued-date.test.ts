import { formatIssuedDate } from "./format-issued-date";

describe("formatIssuedDate", () => {
  it("returns empty string for null", () => {
    expect(formatIssuedDate(null)).toBe("");
  });

  it("formats a valid timestamp", () => {
    const timestamp = new Date("2024-03-15").getTime();
    expect(formatIssuedDate(timestamp)).toMatch(/2024/);
    expect(formatIssuedDate(timestamp)).toMatch(/March|marzo|maart/i);
  });
});
