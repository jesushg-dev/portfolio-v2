/**
 * Full-page navigation. Used after auth API calls so the session cookie set by
 * the response is sent with the next request (a client-side router push would
 * reuse the stale RSC payload). Kept in its own module so tests can mock it —
 * jsdom no longer allows redefining `window.location`.
 */
export function hardNavigate(url: string): void {
  window.location.assign(url);
}
