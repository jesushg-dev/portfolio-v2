import { buildContributionYear, contribCellClass } from "./contrib-year";

describe("buildContributionYear", () => {
  it("returns the requested number of cells with levels 0-4", () => {
    const { cells, total } = buildContributionYear("en", 56);
    expect(cells).toHaveLength(56);
    expect(total).toBeGreaterThanOrEqual(0);
    expect(cells.every((cell) => cell.level >= 0 && cell.level <= 4)).toBe(
      true,
    );
    expect(contribCellClass(0)).toContain("bg-border");
    expect(contribCellClass(4)).toContain("bg-primary");
  });

  it("is deterministic for the same day count", () => {
    expect(buildContributionYear("en", 28).total).toBe(
      buildContributionYear("en", 28).total,
    );
  });
});
