# Public RSC bundle isolation

This report records the completed router-isolation phase before the separately
approved static-rendering changes. Its measurements are historical; the current
static implementation has since passed build, typecheck and lint according to the user. See
[public-static-rendering-plan.md](./public-static-rendering-plan.md) for its status.

## Result

The public RSC caller now composes portfolio, contact, terminal and processPages only. The complete HTTP API and client AppRouter type retain all routers. Both compositions reuse the same router instances. No admin server code imports @/trpc/server. The footer mock remains valid because that module's public API did not change.

All 17 public page traces are free of CV templates, unpdf and PDF.js, with zero missing files. The home trace saves 9.73 MiB. No CV tracing exclusions or additional includes were required: both CV APIs and the complete tRPC API still contain all four templates. Admin pages continue to use their existing data access and the complete HTTP API.

## Baseline prerequisite

The original frozen installation resolved Effect 4.1.0 through an unbounded override. The initial build failed with 337 missing-module errors (including effect/ConfigError); Prisma generation also failed on Schema.Union. UploadThing declares Effect 3.17.7 and Prisma config declares Effect 3.21.0. Constraining the override to >=3.20.0 <4 resolved Effect 3.22.4 and restored Prisma generation and compilation. Both successful before/after builds use this identical dependency fix.

The supplied measure-trace.mjs actually listed the largest home files, and top-files.mjs was absent. The two scripts now provide per-route sums/JSON and the largest files for an optional trace path, respectively.

## Build classifications

Before and after: 100 dynamic (ƒ), 2 static (○), 0 SSG (●). Proxy is not counted as a page route. Static rendering has deliberately not been implemented.

## Per-public-route measurements

Source: two successful local pnpm build runs on Windows, same source except the router separation, same dependencies. MiB means 1,048,576 bytes; totals include every unique file in each trace, without compression or cross-function deduplication.

- `[locale]/(home)`: 214.21 → 204.48 MiB; CV assets 4 → 0; PDF.js files 3 → 0.
- `[locale]/(home)/@modal/(.)schedule`: 213.95 → 204.22 MiB; CV assets 4 → 0; PDF.js files 3 → 0.
- `[locale]/(home)/@modal/(.)skills/[slug]`: 213.98 → 204.25 MiB; CV assets 4 → 0; PDF.js files 3 → 0.
- `[locale]/(home)/certificates/[[...slug]]`: 214.06 → 204.33 MiB; CV assets 4 → 0; PDF.js files 3 → 0.
- `[locale]/(home)/colophon`: 213.96 → 204.23 MiB; CV assets 4 → 0; PDF.js files 3 → 0.
- `[locale]/(home)/curriculum-vitae`: 214.18 → 204.46 MiB; CV assets 4 → 0; PDF.js files 3 → 0.
- `[locale]/(home)/now`: 214.15 → 204.43 MiB; CV assets 4 → 0; PDF.js files 3 → 0.
- `[locale]/(home)/privacy`: 213.93 → 204.21 MiB; CV assets 4 → 0; PDF.js files 3 → 0.
- `[locale]/(home)/process/[slug]`: 213.98 → 204.26 MiB; CV assets 4 → 0; PDF.js files 3 → 0.
- `[locale]/(home)/projects`: 214.00 → 204.27 MiB; CV assets 4 → 0; PDF.js files 3 → 0.
- `[locale]/(home)/projects/[slug]`: 214.06 → 204.34 MiB; CV assets 4 → 0; PDF.js files 3 → 0.
- `[locale]/(home)/schedule`: 213.95 → 204.22 MiB; CV assets 4 → 0; PDF.js files 3 → 0.
- `[locale]/(home)/skills/[slug]`: 213.99 → 204.26 MiB; CV assets 4 → 0; PDF.js files 3 → 0.
- `[locale]/(home)/stats`: 213.94 → 204.22 MiB; CV assets 4 → 0; PDF.js files 3 → 0.
- `[locale]/(home)/theme-customizer`: 213.95 → 204.23 MiB; CV assets 4 → 0; PDF.js files 3 → 0.
- `[locale]/(home)/timeline`: 213.98 → 204.26 MiB; CV assets 4 → 0; PDF.js files 3 → 0.
- `[locale]/(home)/uses`: 213.93 → 204.20 MiB; CV assets 4 → 0; PDF.js files 3 → 0.

## Important size limitation

The requested total below ~6 MB is NOT met by these local traces. They cannot reproduce the supplied ~11.5 MB reference: home is 214.21 → 204.48 MiB. In the after trace, Prisma-related files account for 199.66 MiB, including a required 20.20 MiB native Windows engine, six 20.20 MiB temporary engine copies, and runtime WASM files for other providers. Everything outside Prisma totals 4.82 MiB; this diagnostic subtotal is not the complete deployment size and does not satisfy the original total-size criterion.

No required database engine was removed to make the metric appear smaller. A Linux/Vercel build must be measured before making any claim about deployment size or the 7.68 GB Functions Storage usage. Ubuntu is installed locally but has no Linux Node runtime; Docker's Linux engine is not running. Installing another runtime or changing Prisma packaging is separate from this router isolation. Existing retained deployments are not deleted by this change.

## Reproduce

- Run pnpm build.
- Run node measure-trace.mjs for all route totals, or add --json.
- Run node measure-trace.mjs --check-public to reject CV/PDF.js contamination and check that CV APIs still contain all templates.
- Run node top-files.mjs, or pass any page.js.nft.json / route.js.nft.json path.
- Compare raw bytes in public-bundle-traces.json; do not compare a partial dependency subtotal to a complete trace.

## Static rendering proposal

See [public-static-rendering-plan.md](./public-static-rendering-plan.md). That phase is now implemented; these bundle measurements still describe the earlier isolation-only build.

## Validation and remaining work

- Both production builds completed successfully. Independent typecheck completed
  successfully before the user requested stopping validation.
- All 338 unit suites / 1,522 tests passed, including the public router and footer.
- The first ESLint run reported errors in the measurement scripts. Their JSON
  parsing now has explicit JSDoc types and uses compatible string operations;
  the subsequent ESLint run was stopped at the user's request, so a clean lint
  result is not claimed.
- The production E2E run and its local server were stopped at the user's request.
  No complete E2E result is claimed for this change.
- No further tests, typecheck or ESLint are to be run without renewed instruction.
- No live Vercel deployment, Functions Storage measurement, deployment cleanup,
  or external PDF conversion was performed. The total trace-size goal remains
  unmet in this Windows environment for the reasons above.

## Latest local measurement after static rendering

The user completed formatting, typecheck, lint and build. The subsequent trace
check passed: public routes contain no CV templates or PDF.js, all traced files
exist, and the three CV/tRPC APIs retain their templates. The home trace is 83.53 MiB; public traces range from 83.25 to 83.53 MiB. Six redundant Windows engine temporary files
were removed after verifying their hashes against the retained native engine.
The remaining Prisma runtime still dominates these Windows trace totals; this
is not a Linux/Vercel deployment measurement and does not meet the original
6 MiB target. See `public-bundle-traces-current.json` for the current results;
`public-bundle-traces.json` retains the isolation-phase baseline. No new build,
tests, typecheck or ESLint were run by the agent for this measurement.
