/**
 * Public pages that appear in the navbar and footer before they ship.
 * Flip a flag to `true` when that route is ready for production.
 */
export const PUBLIC_PAGE_LIVE = {
  uses: false,
  now: false,
  colophon: true,
  stats: true,
} as const;

export type PublicPreviewPageId = keyof typeof PUBLIC_PAGE_LIVE;

export function isPublicPageLive(page: PublicPreviewPageId): boolean {
  return PUBLIC_PAGE_LIVE[page];
}
