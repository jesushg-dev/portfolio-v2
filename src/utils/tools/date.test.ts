import { formatExperienceDates } from "./date";

describe("formatExperienceDates", () => {
  it("formats dates in UTC to prevent timezone offsets shifting the month back", () => {
    // This date is midnight UTC on Jan 1, 2023.
    // In local timezones (e.g., UTC-6), this is Dec 31, 2022.
    // If the formatter doesn't use { timeZone: "UTC" }, it will render "Diciembre 2022".
    const startDate = new Date("2023-01-01T00:00:00.000Z");

    const formattedEs = formatExperienceDates(startDate, null, true, "es");
    const formattedEn = formatExperienceDates(startDate, null, true, "en");

    // Must be Enero / January, NOT Diciembre / December
    expect(formattedEs).toMatch(/^Enero\sde\s2023/);
    expect(formattedEn).toMatch(/^January\s2023/);
  });

  it("formats start and end dates correctly", () => {
    const startDate = new Date("2022-06-01T00:00:00.000Z");
    const endDate = new Date("2023-07-01T00:00:00.000Z");

    const formattedEs = formatExperienceDates(startDate, endDate, false, "es");

    expect(formattedEs).toBe("Junio de 2022 – Julio de 2023");
  });

  it("handles 'Present' correctly", () => {
    const startDate = new Date("2024-09-01T00:00:00.000Z");

    const formattedEs = formatExperienceDates(startDate, null, true, "es");
    expect(formattedEs).toBe("Septiembre de 2024 – Presente");

    const formattedEn = formatExperienceDates(startDate, null, true, "en");
    expect(formattedEn).toBe("September 2024 – Present");
  });

  it("returns empty string when startDate is null or undefined", () => {
    expect(formatExperienceDates(null, null, false, "en")).toBe("");
    expect(formatExperienceDates(undefined, null, false, "en")).toBe("");
  });

  it("falls back to presentLabel.en when requested locale key is missing in presentLabel map", () => {
    const startDate = new Date("2023-06-01T00:00:00.000Z");
    // Locale is "es", but presentLabel only has "en" key → presentLabel["es"] is undefined → falls back to presentLabel.en
    const result = formatExperienceDates(startDate, null, true, "es", {
      en: "DefaultPresent",
    });
    expect(result).toContain("DefaultPresent");
  });

  it("uses current=false with endDate null path (shows Present label)", () => {
    const startDate = new Date("2022-01-01T00:00:00.000Z");
    // current is false but endDate is also null → treats as ongoing (no endDate)
    const result = formatExperienceDates(startDate, null, false, "en");
    expect(result).toContain("Present");
  });
});
