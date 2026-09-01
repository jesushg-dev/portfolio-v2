import { isSkillChipText, skillAlignedBudget } from "./skill-chip-budget";

describe("skillAlignedBudget", () => {
  it("gives short skill labels room for JD wording", () => {
    expect(isSkillChipText("React")).toBe(true);
    expect(skillAlignedBudget("React")).toBeGreaterThanOrEqual(
      "React 18+".length,
    );
    expect(isSkillChipText("Built APIs with Node.js.")).toBe(false);
    expect(skillAlignedBudget("Built APIs with Node.js.")).toBe(
      "Built APIs with Node.js.".length,
    );
  });
});
