import { usesItemAnchorId, USES_ITEM_ANCHOR_PREFIX } from "./uses-item-anchor";

describe("usesItemAnchorId", () => {
  it("prefixes the item id", () => {
    expect(usesItemAnchorId("abc")).toBe(`${USES_ITEM_ANCHOR_PREFIX}abc`);
  });
});
