import { formatIssuedDate } from "./format-issued-date";

describe("formatIssuedDate", () => {
  it("returns empty string for null", () => {
    expect(formatIssuedDate(null, "en")).toBe("");
  });

  it("formats a valid timestamp", () => {
    const timestamp = new Date("2024-03-15").getTime();
    expect(formatIssuedDate(timestamp, "en")).toMatch(/2024/);
    expect(formatIssuedDate(timestamp, "en")).toMatch(/March/i);
    expect(formatIssuedDate(timestamp, "es")).toMatch(/marzo/i);
  });
});
