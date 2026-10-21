import en from "../../../../messages/en.json";
import es from "../../../../messages/es.json";
import nl from "../../../../messages/nl.json";
import {
  CV_EMPLOYMENT_TYPES,
  getEmploymentTypeLabel,
  normalizeEmploymentType,
} from "./employment-type";

describe("employment-type", () => {
  it("normalizes various formats to uppercase enum values", () => {
    expect(normalizeEmploymentType("Part-time")).toBe("PART_TIME");
    expect(normalizeEmploymentType("part-time")).toBe("PART_TIME");
    expect(normalizeEmploymentType("PART_TIME")).toBe("PART_TIME");
    expect(normalizeEmploymentType("Full-time")).toBe("FULL_TIME");
    expect(normalizeEmploymentType(undefined)).toBe("FULL_TIME");
    expect(normalizeEmploymentType(null)).toBe("FULL_TIME");
    expect(normalizeEmploymentType("unknown")).toBe("FULL_TIME");
  });

  it("returns localized labels for each locale", () => {
    expect(getEmploymentTypeLabel("PART_TIME", "es")).toBe("Medio tiempo");
    expect(getEmploymentTypeLabel("PART_TIME", "en")).toBe("Part-time");
    expect(getEmploymentTypeLabel("PART_TIME", "nl")).toBe("Deeltijd");

    expect(getEmploymentTypeLabel("FULL_TIME", "es")).toBe("Tiempo completo");
    expect(getEmploymentTypeLabel("FULL_TIME", "en")).toBe("Full-time");
    expect(getEmploymentTypeLabel("FULL_TIME", "nl")).toBe("Voltijd");
  });

  it("matches translation entries in messages JSON files", () => {
    for (const type of CV_EMPLOYMENT_TYPES) {
      expect(getEmploymentTypeLabel(type, "es")).toBe(
        es.curriculum.employmentTypes[type],
      );
      expect(getEmploymentTypeLabel(type, "en")).toBe(
        en.curriculum.employmentTypes[type],
      );
      expect(getEmploymentTypeLabel(type, "nl")).toBe(
        nl.curriculum.employmentTypes[type],
      );
    }
  });
});
