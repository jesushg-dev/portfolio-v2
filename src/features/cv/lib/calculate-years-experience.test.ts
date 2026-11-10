import { calculateCumulativeYearsExperience } from "./calculate-years-experience";

describe("calculateCumulativeYearsExperience", () => {
  it("returns 0 when experiences list is empty", () => {
    expect(calculateCumulativeYearsExperience([])).toBe(0);
  });

  it("returns 0 when experiences have no valid start dates", () => {
    expect(
      calculateCumulativeYearsExperience([{ startDate: null, endDate: null }]),
    ).toBe(0);
  });

  it("calculates exact years for a single continuous experience", () => {
    const experiences = [
      {
        startDate: new Date("2020-01-01T00:00:00Z"),
        endDate: new Date("2023-01-01T00:00:00Z"),
      },
    ];
    expect(calculateCumulativeYearsExperience(experiences)).toBe(3);
  });

  it("merges overlapping parallel experiences without double-counting", () => {
    const experiences = [
      {
        startDate: new Date("2020-01-01T00:00:00Z"),
        endDate: new Date("2022-01-01T00:00:00Z"),
      },
      {
        startDate: new Date("2021-01-01T00:00:00Z"),
        endDate: new Date("2022-06-01T00:00:00Z"),
      },
    ];
    // 2020-01-01 to 2022-06-01 is 2.5 years -> floor is 2
    expect(calculateCumulativeYearsExperience(experiences)).toBe(2);
  });

  it("discounts gaps between non-overlapping roles", () => {
    const experiences = [
      {
        startDate: new Date("2020-01-01T00:00:00Z"),
        endDate: new Date("2021-01-01T00:00:00Z"), // 1 year
      },
      // 1 year gap (2021 to 2022)
      {
        startDate: new Date("2022-01-01T00:00:00Z"),
        endDate: new Date("2023-01-01T00:00:00Z"), // 1 year
      },
    ];
    // Total is 2 years, not 3
    expect(calculateCumulativeYearsExperience(experiences)).toBe(2);
  });

  it("computes 6 years for the canonical portfolio experiences on 2026-11-01", () => {
    const canonicalExperiences = [
      {
        startDate: new Date("2025-08-01T00:00:00.000Z"),
        endDate: new Date("2026-08-01T00:00:00.000Z"),
      },
      {
        startDate: new Date("2024-09-01T00:00:00.000Z"),
        endDate: new Date("2025-08-01T00:00:00.000Z"),
      },
      {
        startDate: new Date("2024-11-01T00:00:00.000Z"),
        endDate: new Date("2025-03-01T00:00:00.000Z"),
      },
      {
        startDate: new Date("2023-08-01T00:00:00.000Z"),
        endDate: new Date("2024-11-01T00:00:00.000Z"),
      },
      {
        startDate: new Date("2022-06-01T00:00:00.000Z"),
        endDate: new Date("2023-07-01T00:00:00.000Z"),
      },
      {
        startDate: new Date("2022-02-01T00:00:00.000Z"),
        endDate: new Date("2022-05-01T00:00:00.000Z"),
      },
      {
        startDate: new Date("2019-11-01T00:00:00.000Z"),
        endDate: new Date("2021-12-01T00:00:00.000Z"),
      },
    ];

    const result = calculateCumulativeYearsExperience(
      canonicalExperiences,
      new Date("2026-11-01T00:00:00Z"),
    );
    expect(result).toBe(6);
  });
});
