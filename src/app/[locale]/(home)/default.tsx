/**
 * Required when `(home)` uses `@modal` intercepts but the full page lives in `(portfolio)`.
 * On soft navigation to `/skills/[slug]`, no `(home)/skills/*` page matches `children` — this
 * fallback keeps the slot valid while the intercepted modal renders in `@modal`.
 */
export default function HomeDefault() {
  return null;
}
