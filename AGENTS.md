<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Forbidden: raw `px` sizes

Do not use CSS / `className` / `style` sizes in `px` (`w-[72px]`, `7px`, `style={{ width: 7 }}`). Use rem or Tailwind spacing/size tokens (`min-w-18`, `p-1.5`, `inset-1`). Prefer the Tailwind scale (`4` = 1rem, `1` = 0.25rem, `1.5` = 0.375rem, `2` = 0.5rem). Arbitrary rem (`min-w-[4.5rem]`) only when no token exists.

JS numbers from `getBoundingClientRect` (and similar) may stay in CSS pixels. Design constants that feed layout must be rem (Tailwind-aligned when possible) and converted to px from the root font size at use time.

Applies to new and touched code — do not mass-rewrite historical `px`.

# Forbidden: inline helper render functions inside components

Do not create `const renderFoo = () => ...` or nested component functions inside component bodies. Decompose into standalone top-level components or dedicated files with explicit typed props.

# Strict Zero-Legacy Policy — No Deprecated Shims, Remnants, or Dead Code

Unless the user explicitly instructs otherwise, NEVER keep:

- Legacy redirect pages, route shims, or deprecated alias routes.
- Deprecated database models, schema remnants, or dead collections.
- Commented-out dead code, temporary backward-compatibility flags, or unused router procedures.
- Deprecated mock tables or unused legacy helpers.

ALWAYS purge legacy assets completely and refactor to clean modern implementations.

# Canonical Tab Systems — Strict Prohibition of Ad-Hoc Tabs

### ❌ NEVER create ad-hoc tab components, hand-rolled segmented button bars, or parallel tab designs
Do not invent custom `<button>` groups, segmented controls, or hand-rolled tab bars (`<div role="group">{TYPES.map(...)}</div>`).

### ✅ ALWAYS use the EXACT 2 canonical tab systems:
1. **Public / Portfolio Tabs (`@/components/custom-ui/custom-tab`):**
   - **Design 1 (Pill / Filters):** `minimal={true}`. Rounded pill format with sliding indicator, glow, and icon. Single source of truth for public filters (Home Portfolio, `/projects` catalog).
   - **Design 2 (Card / Detailed):** `minimal={false}`. Structured card tabs with large icon, title, and description (Services, CV, Experience).
2. **Admin & Forms Tabs (`@/components/ui/tabs`):**
   - Base UI / Shadcn tabs (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) exclusively for admin consoles and form dialogs.

