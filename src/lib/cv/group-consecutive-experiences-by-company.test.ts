import {
  areSameCompany,
  groupConsecutiveExperiencesByCompany,
  normalizeCompanyKey,
  parseExperienceDate,
  unifyConsecutiveExperiencesByCompany,
} from "./group-consecutive-experiences-by-company";

describe("normalizeCompanyKey", () => {
  it("trims and lowercases", () => {
    expect(normalizeCompanyKey("  Contollo ")).toBe("contollo");
  });
});

describe("areSameCompany", () => {
  it("matches case-insensitively with surrounding spaces", () => {
    expect(areSameCompany("Contollo", " contollo ")).toBe(true);
  });

  it("rejects empty or different companies", () => {
    expect(areSameCompany("", "")).toBe(false);
    expect(areSameCompany("Contollo", "Ready")).toBe(false);
  });
});

describe("parseExperienceDate", () => {
  it("parses Date and YYYY-MM strings", () => {
    expect(parseExperienceDate(new Date("2024-08-01T00:00:00.000Z"))).toEqual(
      new Date("2024-08-01T00:00:00.000Z"),
    );
    expect(parseExperienceDate("2023-08")).toEqual(
      new Date(Date.UTC(2023, 7, 1)),
    );
  });
});

describe("groupConsecutiveExperiencesByCompany", () => {
  it("stacks consecutive roles at the same company", () => {
    const groups = groupConsecutiveExperiencesByCompany([
      {
        company: "Contollo",
        startDate: "2024-11",
        endDate: "2025-03",
        current: false,
        id: "lead",
      },
      {
        company: "Contollo",
        startDate: "2023-08",
        endDate: "2024-11",
        current: false,
        id: "sse",
      },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.company).toBe("Contollo");
    expect(groups[0]?.roles.map((role) => role.id)).toEqual(["lead", "sse"]);
    expect(groups[0]?.overallStart).toEqual(new Date(Date.UTC(2023, 7, 1)));
    expect(groups[0]?.overallEnd).toEqual(new Date(Date.UTC(2025, 2, 1)));
    expect(groups[0]?.overallCurrent).toBe(false);
  });

  it("does not stack non-adjacent stints at the same company (A → B → A)", () => {
    const groups = groupConsecutiveExperiencesByCompany([
      {
        company: "Contollo",
        startDate: "2024-01",
        endDate: "2024-06",
        id: "a1",
      },
      {
        company: "Ready",
        startDate: "2024-07",
        endDate: "2024-12",
        id: "b",
      },
      {
        company: "Contollo",
        startDate: "2025-01",
        current: true,
        id: "a2",
      },
    ]);

    expect(groups).toHaveLength(3);
    expect(groups.map((group) => group.company)).toEqual([
      "Contollo",
      "Ready",
      "Contollo",
    ]);
    expect(groups[0]?.roles).toHaveLength(1);
    expect(groups[2]?.roles).toHaveLength(1);
    expect(groups[2]?.overallCurrent).toBe(true);
    expect(groups[2]?.overallEnd).toBeNull();
  });

  it("treats casing/spacing differences as the same company", () => {
    const groups = groupConsecutiveExperiencesByCompany([
      { company: "Contollo", startDate: "2024-11", id: "1" },
      { company: " contollo ", startDate: "2023-08", id: "2" },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.roles).toHaveLength(2);
  });
});

describe("unifyConsecutiveExperiencesByCompany", () => {
  it("unifies consecutive stints at the same company into one entry", () => {
    const unified = unifyConsecutiveExperiencesByCompany([
      {
        id: "exp-lead",
        company: "Contollo",
        role: "Development Team Lead",
        location: "Remote · Texas, United States",
        startDate: "2024-11",
        endDate: "2025-03",
        current: false,
        responsibilities: ["Led frontend architecture.", "Migrated Angular."],
      },
      {
        id: "exp-sse",
        company: "Contollo",
        role: "Senior Software Engineer",
        location: "Remote · Texas, United States",
        startDate: "2023-08",
        endDate: "2024-11",
        current: false,
        responsibilities: [
          "Built responsive React interfaces.",
          "Refactored legacy jQuery.",
        ],
      },
    ]);

    expect(unified).toHaveLength(1);
    const item = unified[0];
    expect(item.id).toBe("exp-lead");
    expect(item.company).toBe("Contollo");
    expect(item.role).toBe("Development Team Lead");
    expect(item.startDate).toBe("2023-08");
    expect(item.endDate).toBe("2025-03");
    expect(item.current).toBe(false);
    expect(item.responsibilities).toEqual([
      "Led frontend architecture.",
      "Migrated Angular.",
      "Built responsive React interfaces.",
      "Refactored legacy jQuery.",
    ]);
  });

  it("does not merge non-consecutive stints at the same company", () => {
    const unified = unifyConsecutiveExperiencesByCompany([
      {
        id: "a1",
        company: "Contollo",
        role: "Lead",
        startDate: "2025-01",
        endDate: "2025-06",
        responsibilities: ["Lead team"],
      },
      {
        id: "b1",
        company: "OtherCo",
        role: "Engineer",
        startDate: "2024-06",
        endDate: "2024-12",
        responsibilities: ["Built apps"],
      },
      {
        id: "a2",
        company: "Contollo",
        role: "Dev",
        startDate: "2023-01",
        endDate: "2024-05",
        responsibilities: ["Wrote code"],
      },
    ]);

    expect(unified).toHaveLength(3);
    expect(unified[0]?.id).toBe("a1");
    expect(unified[1]?.id).toBe("b1");
    expect(unified[2]?.id).toBe("a2");
  });
});
