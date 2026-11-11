# Public light theme backgrounds

The home page has three light themes: `main-light`, `orange-light`, and `christmas-light`. The requested direction is a continuous solid white page background. Each theme keeps its own foreground, links, buttons, and small accent details. Dark themes retain their existing gradients and animations.

## What caused the previous misses

- `src/app/globals.css` maps `--background` to `--color-background-100`, but this controls only surfaces that use that token. It does not remove gradients or overlays declared on elements.
- The hero has two decorative children with radial and grid backgrounds. `#top` also has theme-specific background rules. These need to be considered together.
- `HomeTechMarquee` and the `HomeSection` wrappers had transparent backgrounds. A flat `body` color alone did not guarantee that each transition stayed visually solid. The footer has its own gradient and foreground utilities, so turning it light requires updating both background and text contrast.
- A clean Chromium context at 2434px showed white computed backgrounds on `body`, `#portfolio`, and `#experience`, while a user screenshot at similar width showed blue glow across the marquee and experience transition. The exact cause of that difference was not confirmed. Check theme and custom-theme local storage, browser cache, viewport, pseudo-elements, and overlays before assuming a token change solved it.

## Current implementation

- `src/app/globals.css` gives the three light themes white page, hero, and footer backgrounds, plus neutral card and border tokens. It explicitly paints `#main-content`, `.home-tech-marquee`, and `.home-section` white and hides `.home-hero-backdrop` only for light themes.
- `src/features/home/components/hero.tsx`, `home-tech-marquee.tsx`, and `home-section.tsx` expose those stable class hooks. Do not add new broad gradient backgrounds to these light-theme surfaces.
- The theme selector previews use white surfaces and the theme's dark accent. No maximum widths were changed.
- The main home cards (featured project, social proof, experience chart, expertise carousel, and skills terminal) use `.home-card-surface` with `--card-outline` and `--card-elevation`. Light themes set a border and soft shadow to separate white cards from the white page. Dark themes leave both tokens as `none` because their card surface already separates them. Keep functional inner dividers and the separate contact layout intact.

## Verification

1. Check all three themes in the browser at mobile width and at 2434px, especially the hero-to-marquee and portfolio-to-experience boundaries.
2. Inspect computed `background-color` and `background-image` on `#top`, `#main-content`, `.home-tech-marquee`, `.home-section`, and `.site-footer`. Expect solid white and no background image on these surfaces. `.home-hero-backdrop` should be hidden in light themes.
3. Run `node node_modules/@playwright/test/cli.js test e2e/a11y-light-themes.spec.ts --project=a11y --reporter=line` to check WCAG issues after changing palette or contrast.
