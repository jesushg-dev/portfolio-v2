# Foldable-to-Card Handoff Animation & Device Sizing Specification

This document details the architecture, animation math, responsive sizing rules, and critical invariants for the **Foldable Phone to Contact Card Handoff Animation** and the **iOS Device Scaling System** across Portfolio v2.

> [!IMPORTANT]
> **CRITICAL PRESERVATION DIRECTIVE FOR FUTURE AGENTS:**
> The handoff animation from the dual-screen foldable phone in `#blog` into the `#contact` card is a signature visual experience of the portfolio. **Do NOT break, simplify, bypass, or discard this animation.** Future agents must read the [Critical Invariants & Anti-Patterns](#critical-invariants--anti-patterns-do-not-destroy) section before making any changes to `contact-scene.ts`, `contact/index.tsx`, or the device styling.

---

## 1. High-Level Concept & Visual Journey

The portfolio uses an ongoing hardware metaphor:

1. **Hero Section (`#top`):** A high-fidelity, interactive 3D iPhone with gyroscope/drag rotation, authentic Apple widgets (dynamic live weather with hourly forecast, profile shortcuts), and an expandable Spotify mini app.
2. **Blog Section (`#blog`):** On desktop (`min-width: 64rem`), the device expands into an unfolded dual-screen book/foldable device displaying blog articles.
3. **Handoff into Contact (`#contact`):** As the visitor scrolls past the Blog towards Contact:
   - **Phase 1 (Hinge Folding):** The dual-screen foldable closes smoothly into a single phone. The inner screens remain flush with no artificial dashed gaps or seams.
   - **Phase 2 (Travel & Docking):** The folded single phone glides downwards and sideways in 3D/screen space, aligning with the target Contact Card position (`targetLandingTop`).
   - **Phase 3 (Morph to Card):** The 3D phone chassis settles and morphs directly into the `<ContactDirectCard />` without leaving empty gaps, jumps, or visual voids.

---

## 2. Animation Mechanics & Mathematics (`contact-scene.ts`)

The animation is orchestrated in `src/components/shared/ios-device/contact-scene.ts`.

### 2.1 Dynamic Distance Calculation

Rather than relying on arbitrary hardcoded pixel heights (which break across different screen resolutions and zoom levels), the scroll progress is calculated dynamically:

```ts
const targetLandingTop = top0 + unit(2.5);
const neededDistance = landing.top + sY - foldStart - targetLandingTop;
const foldDistance = Math.max(unit(30), Math.min(vh * 1.1, neededDistance));
const scrollProgress = clamp((sY - foldStart) / foldDistance);
```

- `foldStart`: The scroll Y offset where the folding transition initiates.
- `neededDistance`: The exact vertical distance needed for the Contact section title/card to reach its comfortable viewport landing line.
- `foldDistance`: Clamped between `30rem` and `1.1 * vh`, guaranteeing that the user sees the full folding and landing motion regardless of monitor aspect ratio.

### 2.2 Folding Phases

- **`closeFrom` to `closeTo`:** The range of `scrollProgress` where the 3D hinge transforms from open ($180^\circ$) to closed ($0^\circ$).
- **No Mid-air Cutoffs:** `skipHandoff` is restricted to keyboard focus or extreme overshoot (`landing.top < top0 - unit(12)`). It **must never** trigger prematurely while the phone is mid-flight.

### 2.3 Elimination of Layout Lifts

Earlier implementations introduced an artificial `contactLift` that pushed the contact container down by 400px, leaving a massive blank gap before the contact section.

In the canonical implementation:

- `contactLift` is strictly `0`.
- The contact container maintains natural DOM flow (`top: ""` and `marginBottom: ""`).
- The 3D canvas coordinates project directly into the DOM bounds of `contactContainer` and the direct contact card (`directContact`).

---

## 3. Responsive Device Sizing & Fluid Dynamic Scaling

Monitors and desktop viewports have ample horizontal and vertical room, while laptops and scaled displays (e.g. 1080p at 125% Windows scaling, giving an effective ~760px viewport height) have constrained vertical space. Sizing **must** dynamically adapt to both width and height fluidly via `clamp()` and `svh` so the phone never clips behind the navbar or overflows the screen.

### 3.1 Fluid Dynamic Dimensions (`ios-device-mockup.module.css`)

Rather than brittle stair-stepped media queries, the chassis scales continuously with the viewport dimensions:

```css
.dimensions {
  --ios-device-width: clamp(16.5rem, min(23vw, 34svh), 24.5rem);
  --ios-device-height: calc(var(--ios-device-width) * 41 / 20);
  --ios-device-screen-inset: calc(var(--ios-device-width) * 0.019);
  --ios-device-ratio: 20 / 41;
  --ios-device-frame-radius: calc(var(--ios-device-width) * 0.104);
  --ios-device-screen-radius: calc(var(--ios-device-width) * 0.098);
}
```

- Bounded by `min(23vw, 34svh)`, the phone height never exceeds ~70% of viewport height on any screen.
- Smooth continuous interpolation across all resolutions from mobile (264px) to 4K displays (392px).

### 3.2 Visual Stage Height (`hero-phone.module.css`)

`.visual` is bounded dynamically by `svh` to leave ample breathing room for the navbar (at least 3.25rem + margin):

```css
.visual {
  position: relative;
  height: clamp(32rem, 78svh, 51rem);
  min-width: 0;
  isolation: isolate;
}
```

### 3.3 3D Camera Distance & Fit Scale (`ios-device-renderer.ts`)

Camera distance (`cam[2]`) calculates fluidly based on viewport dimensions:

```ts
const vh = height / (rootFont || 16);
const vw = width / (rootFont || 16);
const isMobile = vw < 48;
const baseCam = isMobile
  ? 10.7
  : Math.min(10.2, Math.max(8.9, 11.6 - vh * 0.04 - vw * 0.015));
const cam = [0, 0, baseCam];
```

`maxDeviceHeight` uses `height * (appOpen ? 0.88 : 0.74)`, ensuring the projected phone never exceeds 87% of `.visual`, fully preserving top/bottom margins on any display.
`maxDeviceHeight` uses `height * 0.74` (or `0.7` on short screens), ensuring the projected phone never exceeds 87% of `.visual`, fully preserving top/bottom margins on any display.
`maxDeviceHeight` allows up to `height * 0.95` during app open and `0.88`–`0.92` on wide desktop, preventing artificial clipping.

---

## 4. Mini App Sizing & Accessibility (WCAG 2.2 AAA)

When mini apps (such as Spotify) open inside the phone viewport:

### 4.1 No Narrow Width Clamps

- **FORBIDDEN:** Do NOT add `max-w-[15.3125rem]` or narrow width clamps that force the mini app into a tiny column.
- **CANONICAL:** The content container uses `w-full max-w-[24rem] mx-auto` with `px-4 pb-6`, allowing album art and controls to fill the available screen width naturally with proper margins.

### 4.2 Album Cover & Typography

- **Cover Image:** Scaled up to `max-w-[20rem] sm:max-w-[22rem]` with 384×384 resolution.
- **Track Title:** `text-xl sm:text-2xl font-bold leading-tight`.
- **Artist Name:** `text-sm sm:text-base text-white/80` (strictly ≥ 14px for WCAG AAA).
- **Sub-headers:** `text-sm font-semibold`.

### 4.3 Touch Targets

- **Buttons & Clickables:** Must provide at least `44×44px` hit areas:
  - Close buttons: `size-11` (44px) with `ChevronDown size-6`.
  - Links / Actions ("Open in Spotify"): `min-h-11 px-3.5 py-1.5`.

### 4.4 Lyrics Card Sizing (`lyrics-card.tsx`)

- **No Aspect Ratio Lockdown:** Never use `aspect-[10/9]`, which creates a huge dead void below the card.
- **Vertical Expansion:** Uses `min-h-[16rem] sm:min-h-[18rem]` and `flex-1` to fill the lower half of the phone gracefully.
- **Lyrics Typography:** `text-lg sm:text-xl font-bold leading-relaxed` for synced lyrics, ensuring effortless legibility without zooming.

---

## 5. Critical Invariants & Anti-Patterns ("DO NOT DESTROY")

> [!CAUTION]
> The following actions are strictly prohibited in this codebase:

1. **❌ DO NOT re-introduce `contactLift` or artificial section margins:**
   Modifying the top/margin of the Contact section to simulate landing creates massive blank spaces on desktop screens. The section must remain in natural flow.
2. **❌ DO NOT re-introduce premature `skipHandoff` scroll checks:**
   Removing the scroll-progress handoff check causes the phone to snap or disappear instantly before reaching the card. The visitor must see the continuous spring docking into the card.
3. **❌ DO NOT add dashed lines or artificial gutters between foldable screens:**
   The foldable dual screens are connected continuously at the hinge. Never add border-dashed or separation borders to the inner display.
4. **❌ DO NOT use hardcoded `px` sizes in CSS or components:**
   Always use Tailwind rem tokens (`size-11`, `min-h-11`, `text-sm`, `max-w-[20rem]`).
5. **❌ DO NOT use `dark:` classes:**
   The theming system uses the root `data-theme` attribute. Semantic tokens (`bg-card`, `text-foreground`, `border-border`) handle theme switches automatically.
6. **❌ DO NOT downgrade typography or touch targets below WCAG 2.2 AAA:**
   Minimum text size is 14px (`text-sm`), minimum clickable target is 44×44px.

---

## 6. Key Source Files Reference

- **Animation Engine:** [`src/components/shared/ios-device/contact-scene.ts`](file:///c:/Users/User/Desktop/portfolio-v2/src/components/shared/ios-device/contact-scene.ts)
- **Handoff Styles:** [`src/components/shared/ios-device/contact-scene.css`](file:///c:/Users/User/Desktop/portfolio-v2/src/components/shared/ios-device/contact-scene.css)
- **Target Contact Card:** [`src/features/home/components/contact/contact-direct-card.tsx`](file:///c:/Users/User/Desktop/portfolio-v2/src/features/home/components/contact/contact-direct-card.tsx)
- **Contact Layout:** [`src/features/home/components/contact/index.tsx`](file:///c:/Users/User/Desktop/portfolio-v2/src/features/home/components/contact/index.tsx)
- **Device Mockup Sizing:** [`src/components/shared/ios-device/ios-device-mockup.module.css`](file:///c:/Users/User/Desktop/portfolio-v2/src/components/shared/ios-device/ios-device-mockup.module.css)
- **Visual Stage Height:** [`src/components/shared/ios-device/hero-phone.module.css`](file:///c:/Users/User/Desktop/portfolio-v2/src/components/shared/ios-device/hero-phone.module.css)
- **3D WebGL Camera:** [`src/components/shared/ios-device/ios-device-renderer.ts`](file:///c:/Users/User/Desktop/portfolio-v2/src/components/shared/ios-device/ios-device-renderer.ts)
- **Spotify Mini App:** [`src/components/shared/ios-device/apps/spotify/spotify-now-playing-screen.tsx`](file:///c:/Users/User/Desktop/portfolio-v2/src/components/shared/ios-device/apps/spotify/spotify-now-playing-screen.tsx)
- **Lyrics Card Component:** [`src/components/shared/ios-device/apps/spotify/lyrics-card.tsx`](file:///c:/Users/User/Desktop/portfolio-v2/src/components/shared/ios-device/apps/spotify/lyrics-card.tsx)
