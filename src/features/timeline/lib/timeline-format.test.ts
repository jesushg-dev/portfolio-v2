import {
  getOrganizationInitials,
  formatTimelineMonthYear,
  formatTimelineRange,
  calculateTimelineDuration,
} from "./timeline-format";

describe("getOrganizationInitials", () => {
  it("returns uppercase first letters of first two words", () => {
    expect(getOrganizationInitials("Imagemaker")).toBe("IM");
    expect(getOrganizationInitials("Claro Nicaragua")).toBe("CN");
    expect(getOrganizationInitials("Universidad Nacional de Ingeniería")).toBe(
      "UN",
    );
  });

  it("handles ampersands and special characters", () => {
    expect(getOrganizationInitials("Platzi & comunidad open source")).toBe(
      "PL",
    );
  });

  it("handles single-word or short inputs", () => {
    expect(getOrganizationInitials("Contollo")).toBe("CO");
    expect(getOrganizationInitials("M")).toBe("M");
    expect(getOrganizationInitials("")).toBe("");
  });
});

describe("formatTimelineMonthYear", () => {
  it("formats YYYY strings", () => {
    expect(formatTimelineMonthYear("2022")).toBe("2022");
  });

  it("formats YYYY-MM strings", () => {
    expect(formatTimelineMonthYear("2024-11")).toBe("Nov 2024");
    expect(formatTimelineMonthYear("2025-03")).toBe("Mar 2025");
  });

  it("formats ISO date strings", () => {
    expect(formatTimelineMonthYear("2025-08-01T00:00:00.000Z")).toBe(
      "Aug 2025",
    );
    expect(formatTimelineMonthYear("2024-09-01T00:00:00.000Z")).toBe(
      "Sep 2024",
    );
  });
});

describe("formatTimelineRange", () => {
  it("formats range for ongoing/current roles", () => {
    const range = formatTimelineRange({
      startDate: "2024-09-01T00:00:00.000Z",
      current: true,
      presentLabel: "Present",
    });
    expect(range).toBe("Sep 2024 – Present");
  });

  it("formats bounded date ranges", () => {
    const range = formatTimelineRange({
      startDate: "2023-08-01T00:00:00.000Z",
      endDate: "2025-03-01T00:00:00.000Z",
    });
    expect(range).toBe("Aug 2023 – Mar 2025");
  });

  it("formats year-only single dates when end equals start", () => {
    const range = formatTimelineRange({
      startDate: "2022",
      endDate: "2022",
    });
    expect(range).toBe("2022");
  });
});

describe("calculateTimelineDuration", () => {
  it("computes duration in years and months", () => {
    const dur = calculateTimelineDuration(
      "2023-08-01T00:00:00.000Z",
      "2025-03-01T00:00:00.000Z",
    );
    expect(dur).toBe("1 yr 7 mos");
  });

  it("computes exact years", () => {
    const dur = calculateTimelineDuration(
      "2024-08-01T00:00:00.000Z",
      "2025-08-01T00:00:00.000Z",
    );
    expect(dur).toBe("1 yr");
  });
});
