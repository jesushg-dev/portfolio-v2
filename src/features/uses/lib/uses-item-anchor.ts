export const USES_ITEM_ANCHOR_PREFIX = "uses-item-";

export function usesItemAnchorId(itemId: string): string {
  return `${USES_ITEM_ANCHOR_PREFIX}${itemId}`;
}
