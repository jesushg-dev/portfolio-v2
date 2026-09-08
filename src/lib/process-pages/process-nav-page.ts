export interface ProcessNavPage {
  id: string;
  slug: string;
  navIcon: string;
  menuTitle: string;
  navDescription: string;
}

/**
 * Leftover `global.header.nav.items` ids from before process pages were CMS-driven.
 * Used only when a published page has an empty stored `navDescription`.
 */
export const LEGACY_PROCESS_NAV_ITEM_IDS: Record<string, string> = {
  "how-i-use-ai": "ai-workflow",
  "qa-collaboration": "qa-collaboration",
};
