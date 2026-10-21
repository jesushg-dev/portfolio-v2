import { LEGACY_PROCESS_NAV_ITEM_IDS } from "./process-nav-page";

describe("LEGACY_PROCESS_NAV_ITEM_IDS", () => {
  it("maps published slugs to leftover nav item ids", () => {
    expect(LEGACY_PROCESS_NAV_ITEM_IDS["how-i-use-ai"]).toBe("ai-workflow");
    expect(LEGACY_PROCESS_NAV_ITEM_IDS["qa-collaboration"]).toBe(
      "qa-collaboration",
    );
  });
});
