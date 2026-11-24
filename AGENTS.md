<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Forbidden: raw `px` sizes

Do not use CSS / `className` / `style` sizes in `px` (`w-[72px]`, `7px`, `style={{ width: 7 }}`). Use rem or Tailwind spacing/size tokens (`min-w-18`, `p-1.5`, `inset-1`). Prefer the Tailwind scale (`4` = 1rem, `1` = 0.25rem, `1.5` = 0.375rem, `2` = 0.5rem). Arbitrary rem (`min-w-[4.5rem]`) only when no token exists.

JS numbers from `getBoundingClientRect` (and similar) may stay in CSS pixels. Design constants that feed layout must be rem (Tailwind-aligned when possible) and converted to px from the root font size at use time.

Applies to new and touched code — do not mass-rewrite historical `px`.

# Preserve existing maximum widths

Do not change, add, remove, or override any existing maximum width (`max-width`, Tailwind `max-w-*`, container limits, or equivalent) unless the user explicitly asks for a maximum-width change. Preserve the current width constraints while adjusting layout, spacing, or content.

# Forbidden: inline helper render functions inside components

Do not create `const renderFoo = () => ...` or nested component functions inside component bodies. Decompose into standalone top-level components or dedicated files with explicit typed props.

# Forbidden: Direct DOM Tree Queries & Anti-React Global Document Usage

### ❌ NEVER use raw DOM queries to locate or mutate elements inside React component trees

Do NOT use:

- `document.getElementById()`, `document.querySelector()`, `document.querySelectorAll()` to find components, headers, cards, or list items across the tree.
- `el.querySelectorAll(...)` or `el.querySelector(...)` inside React components when React already manages state, refs, and arrays.
- `document.activeElement` to track which button triggered a modal or action when React synthetic events (`event.currentTarget`) provide it.
- `document.createElement`, `document.body.appendChild`, `document.execCommand` for clipboards or UI helpers.
- Direct DOM mutations (e.g. setting `style.overflow` or manual class hacks on outside elements) when React state, refs, or CSS tokens can achieve it.

### ✅ ALWAYS use React idiomatic patterns:

1. **Refs (`useRef`)**: Bind refs to internal elements for measurements, scrolling, and focus restoration.
2. **Component Composition & Props**: Pass refs, state, or event callbacks down from parents or shared layout boundaries.
3. **Synthetic Events**: Use `event.currentTarget` / `event.target` in event handlers.
4. **Dedicated React Hooks**: Use canonical hooks (`useOutsideClick`, `useReducedMotion`) for viewport/window subscriptions (e.g. `window.addEventListener("keydown")` for Escape, with cleanup).
5. **Modern Standard Web APIs**: Use `navigator.clipboard.writeText(text)` instead of legacy DOM shims.

# Strict Zero-Legacy Policy — No Deprecated Shims, Remnants, or Dead Code

Unless the user explicitly instructs otherwise, NEVER keep:

- Legacy redirect pages, route shims, or deprecated alias routes.
- Deprecated database models, schema remnants, or dead collections.
- Commented-out dead code, temporary backward-compatibility flags, or unused router procedures.
- Deprecated mock tables or unused legacy helpers.

ALWAYS purge legacy assets completely and refactor to clean modern implementations.

# Git Commits — Require Explicit User Instruction per Commit

### ❌ NEVER create git commits automatically or assume permission from previous requests

Do NOT run `git commit` unless the user explicitly instructs you to commit in their immediate request.

- Prior approval or instruction to commit on an earlier request does NOT carry over to subsequent changes.
- For each new commit, the user MUST explicitly ask for it (e.g., "haz commit", "make a commit", "commit these changes").
- If the user has not explicitly requested a commit in their current message, leave changes in the working tree and simply report the status.

# Canonical Tab Systems — Strict Prohibition of Ad-Hoc Tabs

### ❌ NEVER create ad-hoc tab components, hand-rolled segmented button bars, or parallel tab designs

Do not invent custom `<button>` groups, segmented controls, or hand-rolled tab bars (`<div role="group">{TYPES.map(...)}</div>`).

### ✅ Use only these two visual styles:

1. **Line tabs:** `@/components/ui/tabs` with `TabsList variant="line"` (the default). Use for admin sections and forms. The active tab has a bottom underline and accent text.
2. **Pill tabs:** `@/components/custom-ui/custom-tab` for public portfolio filters, or `@/components/ui/tabs` with `TabsList variant="pill"` for admin filters. The active tab has a rounded outline and the public component keeps its sliding indicator.

Keep layout classes (width, overflow, spacing) at call sites; keep tab shape, colors, active state, and indicator styling inside the canonical components. Do not add card tabs, segmented tabs, or new visual variants.

# Universal Icon System & Selector — Canonical Component: UniversalIconPicker & DynamicIcon

### ❌ NEVER create ad-hoc icon select pickers, hardcoded string icon dropdowns, or parallel icon resolution maps

Do not create custom icon dropdowns, inline string-based icon selects (`<Select>{["code", "server"].map(...)}</Select>`), or hand-rolled string-to-icon dictionaries across feature folders.

### ✅ ALWAYS use or extend `UniversalIconPicker`, `DynamicIcon`, and `icon-registry`

1. **For Form Inputs & Admin Selectors (`UniversalIconPicker`):**
   - Import `UniversalIconPicker` from `@/components/shared/universal-icon-picker`.
   - Use existing presets (`"service"`, `"soft-skill"`, `"case-study"`, `"all"`).
   - If a new domain or icon category is needed, **extend** `src/lib/icons/icon-registry.ts` with new options / presets instead of creating a separate picker.
2. **For Dynamic Rendering from Database / String Keys (`DynamicIcon` / `resolveIcon`):**
   - Import `DynamicIcon` from `@/components/shared/dynamic-icon` to render any registered icon key in JSX.
   - Or import `resolveIcon` from `@/lib/icons/icon-registry` when passing the icon component directly to primitives like `TabItem`.

# Light theme backgrounds

When changing the three public light themes, read `docs/light-theme-backgrounds.md`. Their home page must keep one continuous solid white surface across the hero, technology marquee, and sections. Theme identity belongs in text, controls, and small accents. Check the page at wide and mobile viewports; changing `--background` alone does not cover decorative layers or section wrappers.
