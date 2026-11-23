import {
  formatHeroServices,
  formatHeroServiceLabel,
  formatHeroServiceTech,
  resolveCircuitLabels,
  formatHeroDeviceProfile,
} from "./hero-device-data";
import { DEFAULT_HERO_SERVICES } from "@/components/shared/ios-device/hero-device-artwork";

describe("hero-device-data", () => {
  describe("formatHeroServiceLabel", () => {
    it("extracts clean short names before delimiters", () => {
      expect(formatHeroServiceLabel("Backend & Systems")).toBe("Backend");
      expect(formatHeroServiceLabel("Frontend · UI")).toBe("Frontend");
      expect(formatHeroServiceLabel("Cloud / Infra")).toBe("Cloud");
      expect(formatHeroServiceLabel("Architecture")).toBe("Architectu");
    });
  });

  describe("formatHeroServiceTech", () => {
    it("normalizes common tech names", () => {
      expect(
        formatHeroServiceTech({ technologies: [{ title: "Nest.js" }] }),
      ).toBe("NestJS");
      expect(
        formatHeroServiceTech({ technologies: [{ title: "Node.js" }] }),
      ).toBe("Node.js");
      expect(formatHeroServiceTech({ technologies: [{ title: "C#" }] })).toBe(
        ".NET",
      );
      expect(formatHeroServiceTech({ technologies: [{ title: ".NET" }] })).toBe(
        ".NET",
      );
      expect(
        formatHeroServiceTech({ technologies: [{ title: "React" }] }),
      ).toBe("React");
    });

    it("falls back to Cloud when technologies are missing", () => {
      expect(formatHeroServiceTech({})).toBe("Cloud");
    });
  });

  describe("formatHeroServices", () => {
    it("returns default services when input is empty or undefined", () => {
      expect(formatHeroServices()).toEqual(DEFAULT_HERO_SERVICES);
      expect(formatHeroServices([])).toEqual(DEFAULT_HERO_SERVICES);
    });

    it("maps up to 4 services and pads with defaults if fewer", () => {
      const mockServices = [
        {
          title: "Backend & Systems",
          badge: "Backend",
          technologies: [{ title: "Nest.js" }],
        },
        {
          title: "Architecture",
          technologies: [{ title: "DDD" }],
        },
      ];

      const result = formatHeroServices(mockServices);
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual(["Backend", "NestJS"]);
      expect(result[1]).toEqual(["Architectu", "DDD"]);
      expect(result[2]).toEqual(DEFAULT_HERO_SERVICES[2]);
      expect(result[3]).toEqual(DEFAULT_HERO_SERVICES[3]);
    });
  });

  describe("resolveCircuitLabels", () => {
    it("derives circuit and focus labels from role and services", () => {
      const { circuitTitle, circuitSubtitle, focusTitle, focusSubtitle } =
        resolveCircuitLabels("Senior Fullstack Engineer", [
          {
            title: "Backend",
            technologies: [{ title: "Node.js" }, { title: "Nest.js" }],
          },
        ]);

      expect(circuitTitle).toBe("FULLSTACK");
      expect(focusTitle).toBe("Fullstack");
      expect(circuitSubtitle).toBe("Node.js · Nest.js");
      expect(focusSubtitle).toBe("Node.js · Nest.js");
    });

    it("handles backend and architect roles with fallbacks", () => {
      const backend = resolveCircuitLabels("Backend Architect");
      expect(backend.circuitTitle).toBe("BACKEND");
      expect(backend.focusTitle).toBe("Backend");
      expect(backend.circuitSubtitle).toBe("REST · GraphQL");

      const architect = resolveCircuitLabels("Lead Solutions Architect");
      expect(architect.circuitTitle).toBe("ARCHITECT");
      expect(architect.focusTitle).toBe("Architecture");
    });
  });

  describe("formatHeroDeviceProfile", () => {
    it("bundles all device properties together", () => {
      const result = formatHeroDeviceProfile({
        heroSubtitle: "Frontend Developer",
        services: [
          {
            title: "Frontend Apps",
            technologies: [{ title: "React" }, { title: "TypeScript" }],
          },
        ],
      });

      expect(result.circuitTitle).toBe("FRONTEND");
      expect(result.circuitSubtitle).toBe("React · TypeScript");
      expect(result.services).toHaveLength(4);
      expect(result.services[0]).toEqual(["Frontend", "React"]);
    });
  });
});
