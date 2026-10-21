import {
  resolveIcon,
  isUniversalIconKey,
  getIconOptions,
  DEFAULT_FALLBACK_ICON,
} from "./icon-registry";
import { Code2, Server, LayoutGrid } from "lucide-react";
import { RiTeamLine } from "react-icons/ri";

describe("Universal Icon Registry", () => {
  it("resolves exact matches correctly for Lucide and React Icons", () => {
    expect(resolveIcon("code")).toBe(Code2);
    expect(resolveIcon("server")).toBe(Server);
    expect(resolveIcon("layout")).toBe(LayoutGrid);
    expect(resolveIcon("RiTeamLine")).toBe(RiTeamLine);
  });

  it("resolves normalized lowercase keys", () => {
    expect(resolveIcon("CODE")).toBe(Code2);
    expect(resolveIcon("Layout")).toBe(LayoutGrid);
  });

  it("returns fallback for unknown or empty icon keys", () => {
    expect(resolveIcon(null)).toBe(DEFAULT_FALLBACK_ICON);
    expect(resolveIcon(undefined)).toBe(DEFAULT_FALLBACK_ICON);
    expect(resolveIcon("non_existent_key")).toBe(DEFAULT_FALLBACK_ICON);

    const customFallback = LayoutGrid;
    expect(resolveIcon("non_existent_key", customFallback)).toBe(customFallback);
  });

  it("checks whether an icon key is registered", () => {
    expect(isUniversalIconKey("code")).toBe(true);
    expect(isUniversalIconKey("RiTeamLine")).toBe(true);
    expect(isUniversalIconKey("somethingRandom123")).toBe(false);
  });

  it("returns filtered icon options per preset", () => {
    const serviceOptions = getIconOptions("service");
    expect(serviceOptions.length).toBeGreaterThan(0);
    expect(serviceOptions.every((o) => o.category === "service")).toBe(true);

    const softSkillOptions = getIconOptions("soft-skill");
    expect(softSkillOptions.length).toBe(15);
    expect(softSkillOptions.every((o) => o.category === "soft-skill")).toBe(true);

    const caseStudyOptions = getIconOptions("case-study");
    expect(caseStudyOptions.length).toBeGreaterThan(0);
    expect(caseStudyOptions.every((o) => o.category === "case-study")).toBe(true);

    const allOptions = getIconOptions("all");
    expect(allOptions.length).toBeGreaterThan(serviceOptions.length);
  });
});
