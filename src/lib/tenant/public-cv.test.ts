import { isPublicCvVisible } from "./public-cv";

describe("isPublicCvVisible", () => {
  it("is visible for the primary owner even if unpublished", () => {
    expect(isPublicCvVisible({ isPrimary: true, isPublished: false })).toBe(
      true,
    );
  });

  it("is hidden for other tenants until they publish", () => {
    expect(isPublicCvVisible({ isPrimary: false, isPublished: false })).toBe(
      false,
    );
    expect(isPublicCvVisible({ isPrimary: false, isPublished: true })).toBe(
      true,
    );
  });

  it("is hidden when there is no tenant", () => {
    expect(isPublicCvVisible(null)).toBe(false);
  });
});
