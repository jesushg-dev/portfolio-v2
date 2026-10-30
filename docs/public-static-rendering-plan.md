# Public static rendering

Implementation completed. The user reports successful formatting, typecheck,
lint and build. Browser, tenant isolation, CMS invalidation and PDF validation
remain separate; no new checks were run during the cleanup.

## Implementation

- The proxy rewrites public requests to `/p/[site]/[locale]` internally. Browser
  URLs are unchanged. `site=primary` has en/es/nl static params and ISR (120 minutes);
  `site=tenant-<username>` waits for a request using `connection()` and remains
  dynamic. Direct requests to the internal prefix are rejected, so URL parameters
  cannot override the host's tenant.
- Localized HTML roots now live below locale segments. Both roots reuse
  `DocumentRoot`; public code reads `locale` and `site` via `next/root-params`.
  The root no longer reads the locale cookie. Initial HTML has the correct
  language, and `DocumentLang` retains client-navigation synchronization.
- next-intl reads the root locale in `i18n/request.ts`, honoring explicit locale
  overrides for Route Handlers and Server Actions. No `setRequestLocale` calls
  remain. Theme bootstrap runs before hydration.
- Public RSC context has no request headers or auth session. HTTP tRPC and admin
  authentication keep the original request context.
- The primary profile is cached for 120 minutes under a tenant-specific tag. ISR
  HTML depends on that tag. Successful authenticated mutations immediately expire
  the owner's tag, including imports, deletes and integration changes; global
  language changes also expire the primary-identity dependency. Direct DB/CLI
  edits rely on the time-based fallback. Tenant HTML is never shared with primary
  HTML or another tenant.
- PDF rendering has a separate dynamic `cv-render` page outside the public shell.
  Existing `curriculum-vitae?pdf=1` requests are rewritten there internally. PDF
  tenant-proof validation remains in the request-based CV resolver.
- Canonicals/alternates use known route parameters and each portfolio's public
  origin. Project query filters initialize inside a client Suspense boundary,
  instead of making the server page read search parameters.
- Published project/process slugs, skill slugs and certificate categories have
  static params. New primary slugs can be rendered on demand. Admin/auth and the
  regular CV route keep request-time behavior. A global 404 covers unmatched paths.

Remaining runtime validation: all three locales, host isolation, query filters,
intercepted modals, immediate CMS invalidation, auth and PDF.

The intercepted skills page shares `publicSkillParams` with the full skill page;
its detail data is included in the prerendered payload, with a 120-minute client
freshness interval to avoid an immediate tRPC refetch. Close/back stays interactive. GitHub fetches on
`/now` also use 120 minutes and the portfolio tag, avoiding a shorter effective
route interval. Time-based ISR refreshes on a request after expiry, can serve
stale content during regeneration, and retries on failure; it is not a strict
maximum age. Data Cache may persist across deployments: urgent content changes
should use the admin tag invalidation rather than relying on redeploy alone.

The proxy performs host parsing only, with no database imports or calls. It
blocks all external `/p` paths (including dotted SEO paths), applies next-intl
before localized rewrites, and handles tenant SEO rewrites before locale routing.
Primary robots/sitemap remain cached metadata routes; tenant robots and sitemap
use the tenant profile and origin, returning 404 for missing/unpublished tenants.
Tenant sitemap content is cached under its owner tag for 120 minutes; tenant
SEO handlers still resolve the profile per request. Public layouts return 404
for missing tenants. Only primary locale/slug combinations are enumerated at
build time; new primary slugs render on demand, tenants remain dynamic. Builds
query the database to enumerate slugs. Vercel proxy invocations, lvh.me redirect
behavior, login/logout and actual 404 responses still require runtime validation.

Multiple HTML roots mean navigation between public and account areas may reload
the document, as expected for Next.js applications with multiple root layouts.
