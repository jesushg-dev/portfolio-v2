import {
  looksLikeSkillObjectId,
  skillSlugFromTitle,
} from "@/utils/tools/skill-slug";

describe("skillSlugFromTitle", () => {
  it("slugifies common skill titles", () => {
    expect(skillSlugFromTitle("Next.js")).toBe("next-js");
    expect(skillSlugFromTitle("Node.js")).toBe("node-js");
    expect(skillSlugFromTitle("C#")).toBe("c");
    expect(skillSlugFromTitle("  React  Native  ")).toBe("react-native");
  });

  it("falls back when title has no alphanumeric characters", () => {
    expect(skillSlugFromTitle("!!!")).toBe("skill");
  });
});

describe("looksLikeSkillObjectId", () => {
  it("detects Mongo ObjectId-looking strings", () => {
    expect(looksLikeSkillObjectId("6a4def784b925386a5e72113")).toBe(true);
    expect(looksLikeSkillObjectId("next-js")).toBe(false);
  });
});
