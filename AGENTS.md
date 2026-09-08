<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Forbidden: raw `px` sizes

Do not use CSS / `className` / `style` sizes in `px` (`w-[72px]`, `7px`, `style={{ width: 7 }}`). Use rem or Tailwind spacing/size tokens (`min-w-18`, `p-1.5`, `inset-1`). Prefer the Tailwind scale (`4` = 1rem, `1` = 0.25rem, `1.5` = 0.375rem, `2` = 0.5rem). Arbitrary rem (`min-w-[4.5rem]`) only when no token exists.

JS numbers from `getBoundingClientRect` (and similar) may stay in CSS pixels. Design constants that feed layout must be rem (Tailwind-aligned when possible) and converted to px from the root font size at use time.

Applies to new and touched code — do not mass-rewrite historical `px`.
